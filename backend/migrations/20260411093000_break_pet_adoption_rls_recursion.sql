DROP POLICY IF EXISTS "Shelters can view adoption requests for their pets" ON public.adoption_requests;
DROP POLICY IF EXISTS "Shelters can update adoption requests for their pets" ON public.adoption_requests;

CREATE POLICY "Shelters can view adoption requests for their shelter"
ON public.adoption_requests
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'shelter')
  AND shelter_id = auth.uid()
);

CREATE POLICY "Shelters can update adoption requests for their shelter"
ON public.adoption_requests
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'shelter')
  AND shelter_id = auth.uid()
);
