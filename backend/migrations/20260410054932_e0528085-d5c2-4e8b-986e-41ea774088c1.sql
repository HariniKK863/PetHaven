
-- Vet availability slots
CREATE TABLE public.vet_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vet_id UUID NOT NULL,
  slot_date DATE NOT NULL,
  slot_time TEXT NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vet_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vets can manage their own slots" ON public.vet_slots
  FOR ALL TO authenticated
  USING (auth.uid() = vet_id)
  WITH CHECK (auth.uid() = vet_id);

CREATE POLICY "Anyone authenticated can view available slots" ON public.vet_slots
  FOR SELECT TO authenticated
  USING (is_booked = false);

-- Vet appointments
CREATE TABLE public.vet_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vet_id UUID NOT NULL,
  user_id UUID NOT NULL,
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES public.vet_slots(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  medical_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vet_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own appointments" ON public.vet_appointments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own appointments" ON public.vet_appointments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Vets can view appointments for them" ON public.vet_appointments
  FOR SELECT TO authenticated
  USING (auth.uid() = vet_id);

CREATE POLICY "Vets can update appointments for them" ON public.vet_appointments
  FOR UPDATE TO authenticated
  USING (auth.uid() = vet_id);

-- Medical records
CREATE TABLE public.medical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  vet_id UUID NOT NULL,
  appointment_id UUID REFERENCES public.vet_appointments(id) ON DELETE SET NULL,
  diagnosis TEXT NOT NULL,
  treatment TEXT NOT NULL,
  notes TEXT,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vets can create medical records" ON public.medical_records
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'veterinarian'::app_role) AND auth.uid() = vet_id);

CREATE POLICY "Vets can view records they created" ON public.medical_records
  FOR SELECT TO authenticated
  USING (auth.uid() = vet_id);

CREATE POLICY "Pet owners can view their pet records" ON public.medical_records
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM pets WHERE pets.id = medical_records.pet_id AND pets.owner_id = auth.uid()));

-- Trigger for updated_at on vet_appointments
CREATE TRIGGER update_vet_appointments_updated_at
  BEFORE UPDATE ON public.vet_appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
