CREATE OR REPLACE FUNCTION public.sync_vet_slot_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_slot_id uuid;
  previous_slot_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_slot_id := OLD.slot_id;
  ELSIF TG_OP = 'INSERT' THEN
    target_slot_id := NEW.slot_id;
  ELSE
    previous_slot_id := OLD.slot_id;
    target_slot_id := COALESCE(NEW.slot_id, OLD.slot_id);
  END IF;

  IF target_slot_id IS NOT NULL THEN
    UPDATE public.vet_slots
    SET is_booked = EXISTS (
      SELECT 1
      FROM public.vet_appointments
      WHERE slot_id = target_slot_id
        AND status IN ('approved', 'completed')
    )
    WHERE id = target_slot_id;
  END IF;

  IF previous_slot_id IS NOT NULL AND previous_slot_id <> target_slot_id THEN
    UPDATE public.vet_slots
    SET is_booked = EXISTS (
      SELECT 1
      FROM public.vet_appointments
      WHERE slot_id = previous_slot_id
        AND status IN ('approved', 'completed')
    )
    WHERE id = previous_slot_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_vet_slot_booking_on_appointments ON public.vet_appointments;
CREATE TRIGGER sync_vet_slot_booking_on_appointments
AFTER INSERT OR UPDATE OR DELETE ON public.vet_appointments
FOR EACH ROW
EXECUTE FUNCTION public.sync_vet_slot_booking();

UPDATE public.vet_slots vs
SET is_booked = EXISTS (
  SELECT 1
  FROM public.vet_appointments va
  WHERE va.slot_id = vs.id
    AND va.status IN ('approved', 'completed')
);
