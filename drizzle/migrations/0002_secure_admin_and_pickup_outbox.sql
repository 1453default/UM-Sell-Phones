-- Remove first-account privilege escalation while preserving existing role rows.
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
DROP FUNCTION IF EXISTS public.grant_first_admin();

CREATE TABLE public.pickup_notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_request_id uuid NOT NULL UNIQUE REFERENCES public.pickup_requests(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'unknown')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  provider_message_id text,
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pickup_notification_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pickup_notification_outbox FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.pickup_notification_outbox TO authenticated;
GRANT ALL ON public.pickup_notification_outbox TO service_role;
CREATE POLICY "admins read pickup notification status"
  ON public.pickup_notification_outbox
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.pickup_rate_limit_buckets (
  contact_key_hash text PRIMARY KEY CHECK (contact_key_hash ~ '^[0-9a-f]{64}$'),
  tokens numeric NOT NULL DEFAULT 5 CHECK (tokens >= 0 AND tokens <= 5),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pickup_rate_limit_buckets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pickup_rate_limit_buckets FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.pickup_rate_limit_buckets TO service_role;
CREATE INDEX pickup_rate_limit_buckets_updated_at ON public.pickup_rate_limit_buckets (updated_at);

CREATE OR REPLACE FUNCTION public.create_pickup_request_atomic(
  p_reference text,
  p_submission_key uuid,
  p_mobile_key_hash text,
  p_customer_name text,
  p_mobile text,
  p_address_line text,
  p_landmark text,
  p_locality text,
  p_pincode text,
  p_slot_date date,
  p_slot_time text,
  p_brand text,
  p_model text,
  p_variant text,
  p_base_value numeric,
  p_estimate numeric,
  p_answers jsonb,
  p_answer_summary text[]
)
RETURNS TABLE (request_id uuid, reference text, created boolean, rate_limited boolean)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
  v_reference text;
  v_created boolean := false;
  v_tokens numeric;
  v_updated_at timestamptz;
  v_now timestamptz;
  v_refilled_tokens numeric;
BEGIN
  IF p_submission_key IS NOT NULL THEN
    -- Serialize only identical client retries so they do not consume extra tokens.
    PERFORM pg_advisory_xact_lock(hashtextextended(p_submission_key::text, 0));
    SELECT pr.id, pr.reference
      INTO v_request_id, v_reference
      FROM public.pickup_requests AS pr
      WHERE pr.submission_key = p_submission_key;
    IF FOUND THEN
      RETURN QUERY SELECT v_request_id, v_reference, false, false;
      RETURN;
    END IF;
  END IF;

  IF p_mobile_key_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Invalid pickup rate-limit key';
  END IF;

  INSERT INTO public.pickup_rate_limit_buckets (contact_key_hash, tokens, updated_at)
    VALUES (p_mobile_key_hash, 5, clock_timestamp())
    ON CONFLICT (contact_key_hash) DO NOTHING;
  SELECT b.tokens, b.updated_at
    INTO v_tokens, v_updated_at
    FROM public.pickup_rate_limit_buckets AS b
    WHERE b.contact_key_hash = p_mobile_key_hash
    FOR UPDATE;

  v_now := clock_timestamp();
  -- Five burst tokens refill at one token per twelve minutes (five per hour).
  v_refilled_tokens := LEAST(
    5::numeric,
    v_tokens + GREATEST(0, EXTRACT(EPOCH FROM (v_now - v_updated_at))) / 720
  );
  IF v_refilled_tokens < 1 THEN
    UPDATE public.pickup_rate_limit_buckets
      SET tokens = v_refilled_tokens, updated_at = v_now
      WHERE contact_key_hash = p_mobile_key_hash;
    RETURN QUERY SELECT NULL::uuid, NULL::text, false, true;
    RETURN;
  END IF;
  UPDATE public.pickup_rate_limit_buckets
    SET tokens = v_refilled_tokens - 1, updated_at = v_now
    WHERE contact_key_hash = p_mobile_key_hash;

  -- Remove at most 100 inactive hashes per new booking to bound retained identifiers.
  DELETE FROM public.pickup_rate_limit_buckets
    WHERE contact_key_hash IN (
      SELECT b.contact_key_hash
        FROM public.pickup_rate_limit_buckets AS b
        WHERE b.updated_at < v_now - INTERVAL '30 days'
          AND b.contact_key_hash <> p_mobile_key_hash
        ORDER BY b.updated_at
        LIMIT 100
    );

  INSERT INTO public.pickup_requests (
    reference, submission_key, phone_verification_status, customer_name, mobile,
    address_line, landmark, locality, pincode, slot_date, slot_time,
    brand, model, variant, base_value, estimate, answers, answer_summary
  ) VALUES (
    p_reference, p_submission_key, 'unverified', p_customer_name, p_mobile,
    p_address_line, p_landmark, p_locality, p_pincode, p_slot_date, p_slot_time,
    p_brand, p_model, p_variant, p_base_value, p_estimate, p_answers, p_answer_summary
  )
  ON CONFLICT (submission_key) WHERE submission_key IS NOT NULL DO NOTHING
  RETURNING id, pickup_requests.reference INTO v_request_id, v_reference;

  v_created := FOUND;
  IF NOT v_created AND p_submission_key IS NOT NULL THEN
    SELECT pr.id, pr.reference
      INTO v_request_id, v_reference
      FROM public.pickup_requests AS pr
      WHERE pr.submission_key = p_submission_key;
  END IF;

  IF v_created THEN
    INSERT INTO public.pickup_notification_outbox (pickup_request_id)
      VALUES (v_request_id);
  END IF;

  RETURN QUERY SELECT v_request_id, v_reference, v_created, false;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_pickup_notification(p_request_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_claimed boolean := false;
BEGIN
  UPDATE public.pickup_notification_outbox AS o
    SET status = 'sending', attempts = o.attempts + 1,
        last_attempt_at = clock_timestamp(), last_error_code = NULL,
        updated_at = clock_timestamp()
    WHERE o.pickup_request_id = p_request_id
      AND (
        o.status IN ('pending', 'failed')
        OR (o.status = 'sending' AND o.last_attempt_at < clock_timestamp() - INTERVAL '2 minutes'
            AND o.last_attempt_at >= clock_timestamp() - INTERVAL '23 hours')
      )
    RETURNING true INTO v_claimed;
  RETURN COALESCE(v_claimed, false);
END;
$$;

REVOKE ALL ON FUNCTION public.create_pickup_request_atomic(
  text, uuid, text, text, text, text, text, text, text, date, text,
  text, text, text, numeric, numeric, jsonb, text[]
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_pickup_notification(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_pickup_request_atomic(
  text, uuid, text, text, text, text, text, text, text, date, text,
  text, text, text, numeric, numeric, jsonb, text[]
) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_pickup_notification(uuid) TO service_role;
