ALTER TABLE public.injured_reports
  ADD COLUMN IF NOT EXISTS reporter_name text,
  ADD COLUMN IF NOT EXISTS reporter_email text,
  ADD COLUMN IF NOT EXISTS reporter_phone text;

UPDATE public.injured_reports ir
SET
  reporter_name = COALESCE(ir.reporter_name, p.full_name),
  reporter_email = COALESCE(ir.reporter_email, p.email),
  reporter_phone = COALESCE(ir.reporter_phone, p.phone)
FROM public.profiles p
WHERE p.user_id = ir.reporter_id;

DROP POLICY IF EXISTS "Authenticated users can view injured reports" ON public.injured_reports;
CREATE POLICY "Authenticated users can view injured reports"
ON public.injured_reports FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Vets can view profiles for their appointments" ON public.profiles;
CREATE POLICY "Vets can view profiles for their appointments"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'veterinarian')
  AND EXISTS (
    SELECT 1
    FROM public.vet_appointments
    WHERE vet_id = auth.uid()
      AND user_id = profiles.user_id
  )
);

DROP POLICY IF EXISTS "Vets can view pets for their appointments" ON public.pets;
CREATE POLICY "Vets can view pets for their appointments"
ON public.pets FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.vet_appointments
    WHERE vet_id = auth.uid()
      AND pet_id = pets.id
  )
);

CREATE OR REPLACE FUNCTION public.can_view_pet_medical_files(_pet_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.pets
      WHERE id = _pet_id
        AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.medical_records
      WHERE pet_id = _pet_id
        AND vet_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.vet_appointments
      WHERE pet_id = _pet_id
        AND vet_id = auth.uid()
        AND status IN ('pending', 'approved', 'completed')
    )
    OR public.has_role(auth.uid(), 'admin');
$$;
