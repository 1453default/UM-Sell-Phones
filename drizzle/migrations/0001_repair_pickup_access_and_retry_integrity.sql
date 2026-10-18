GRANT SELECT, UPDATE ON public.pickup_requests TO authenticated;
GRANT ALL ON public.pickup_requests TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
ALTER TABLE public.pickup_requests ADD COLUMN IF NOT EXISTS phone_verification_status text NOT NULL DEFAULT 'unverified';
ALTER TABLE public.pickup_requests ADD COLUMN IF NOT EXISTS submission_key uuid;
CREATE UNIQUE INDEX IF NOT EXISTS pickup_submission_key_unique ON public.pickup_requests (submission_key) WHERE submission_key IS NOT NULL;
COMMENT ON COLUMN public.pickup_requests.phone_verification_status IS 'SMS is disabled; phone numbers are unverified unless a future trusted verification service succeeds.';