-- Ensure exactly one account can hold administrator access while leaving
-- future non-admin role assignments unrestricted.
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_single_admin
  ON public.user_roles (role)
  WHERE role = 'admin';
