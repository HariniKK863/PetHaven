DROP POLICY IF EXISTS "Authenticated users can view veterinarian roles" ON public.user_roles;
CREATE POLICY "Authenticated users can view veterinarian roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (role = 'veterinarian');

DROP POLICY IF EXISTS "Authenticated users can view approved veterinarian profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view approved veterinarian profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  verification_status = 'approved'
  AND public.has_role(user_id, 'veterinarian')
);
