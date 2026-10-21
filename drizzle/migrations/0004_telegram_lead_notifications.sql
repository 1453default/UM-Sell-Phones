-- Preserve historical email outbox states while routing new lead alerts to Telegram.
ALTER TABLE public.pickup_notification_outbox
  ADD COLUMN channel text NOT NULL DEFAULT 'email'
  CHECK (channel IN ('email', 'telegram'));

ALTER TABLE public.pickup_notification_outbox
  ALTER COLUMN channel SET DEFAULT 'telegram';

-- Telegram's sendMessage API has no idempotency key. Reclaim only events known
-- not to have been delivered; uncertain `sending` outcomes must be checked first.
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
      AND o.channel = 'telegram'
      AND o.status IN ('pending', 'failed')
    RETURNING true INTO v_claimed;
  RETURN COALESCE(v_claimed, false);
END;
$$;
