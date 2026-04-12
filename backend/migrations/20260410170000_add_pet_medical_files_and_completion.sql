INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-files', 'medical-files', false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS medical_card_file_path text,
  ADD COLUMN IF NOT EXISTS latest_medical_file_path text;

ALTER TABLE public.medical_records
  ADD COLUMN IF NOT EXISTS medical_file_path text;

CREATE OR REPLACE FUNCTION public.can_manage_pet_medical_files(_pet_id uuid)
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
      FROM public.vet_appointments
      WHERE pet_id = _pet_id
        AND vet_id = auth.uid()
        AND status IN ('approved', 'completed')
    )
    OR public.has_role(auth.uid(), 'admin');
$$;

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
        AND status IN ('approved', 'completed')
    )
    OR public.has_role(auth.uid(), 'admin');
$$;

DROP POLICY IF EXISTS "Authorized users can upload pet medical files" ON storage.objects;
CREATE POLICY "Authorized users can upload pet medical files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-files'
  AND public.can_manage_pet_medical_files(((storage.foldername(name))[1])::uuid)
);

DROP POLICY IF EXISTS "Authorized users can view pet medical files" ON storage.objects;
CREATE POLICY "Authorized users can view pet medical files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-files'
  AND public.can_view_pet_medical_files(((storage.foldername(name))[1])::uuid)
);

CREATE OR REPLACE FUNCTION public.complete_vet_appointment_record(
  _appointment_id uuid,
  _diagnosis text,
  _treatment text,
  _notes text DEFAULT NULL,
  _medical_file_path text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  appointment_record public.vet_appointments%ROWTYPE;
  created_record_id uuid;
BEGIN
  SELECT *
  INTO appointment_record
  FROM public.vet_appointments
  WHERE id = _appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  IF appointment_record.vet_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to complete this appointment';
  END IF;

  IF appointment_record.status <> 'approved' THEN
    RAISE EXCEPTION 'Only approved appointments can be completed';
  END IF;

  IF appointment_record.pet_id IS NULL THEN
    RAISE EXCEPTION 'Appointment has no linked pet';
  END IF;

  INSERT INTO public.medical_records (
    pet_id,
    vet_id,
    appointment_id,
    diagnosis,
    treatment,
    notes,
    medical_file_path
  )
  VALUES (
    appointment_record.pet_id,
    appointment_record.vet_id,
    appointment_record.id,
    _diagnosis,
    _treatment,
    _notes,
    _medical_file_path
  )
  RETURNING id INTO created_record_id;

  IF _medical_file_path IS NOT NULL THEN
    UPDATE public.pets
    SET latest_medical_file_path = _medical_file_path
    WHERE id = appointment_record.pet_id;
  END IF;

  UPDATE public.vet_appointments
  SET status = 'completed',
      medical_notes = concat_ws(' - ', _diagnosis, _treatment),
      updated_at = now()
  WHERE id = appointment_record.id;

  RETURN created_record_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_vet_appointment_record(uuid, text, text, text, text) TO authenticated;
