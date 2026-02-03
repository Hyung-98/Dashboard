-- RPC for sign-up email duplicate check (anon can call; function reads auth.users via definer)
CREATE OR REPLACE FUNCTION public.check_email_exists(check_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = check_email);
$$;

GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon;
