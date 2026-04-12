CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_role public.app_role;
BEGIN
  new_user_role := CASE
    WHEN NEW.raw_user_meta_data ->> 'role' IN ('pet_owner', 'shelter', 'veterinarian', 'general_user', 'admin')
      THEN (NEW.raw_user_meta_data ->> 'role')::public.app_role
    ELSE 'general_user'::public.app_role
  END;

  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, new_user_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

INSERT INTO public.user_roles (user_id, role)
SELECT
  u.id,
  CASE
    WHEN u.raw_user_meta_data ->> 'role' IN ('pet_owner', 'shelter', 'veterinarian', 'general_user', 'admin')
      THEN (u.raw_user_meta_data ->> 'role')::public.app_role
    ELSE 'general_user'::public.app_role
  END
FROM auth.users AS u
WHERE NOT EXISTS (
  SELECT 1
  FROM public.user_roles AS ur
  WHERE ur.user_id = u.id
);
