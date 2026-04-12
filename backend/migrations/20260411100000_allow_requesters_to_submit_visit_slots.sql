DROP POLICY IF EXISTS "Requesters can update their own pending adoption requests" ON public.adoption_requests;

CREATE POLICY "Requesters can update their own pending adoption requests"
ON public.adoption_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = requester_id
  AND status = 'pending'
  AND approved_visit_time IS NULL
)
WITH CHECK (
  auth.uid() = requester_id
  AND status = 'pending'
  AND approved_visit_time IS NULL
);
