DROP POLICY IF EXISTS "Requesters can view pets tied to their adoption requests" ON public.pets;

CREATE POLICY "Requesters can view pets tied to their adoption requests"
ON public.pets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.adoption_requests
    WHERE adoption_requests.pet_id = pets.id
      AND adoption_requests.requester_id = auth.uid()
  )
);
