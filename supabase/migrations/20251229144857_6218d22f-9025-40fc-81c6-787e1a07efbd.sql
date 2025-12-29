-- Create storage bucket for documents (vet/shelter verification) and pet images
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('pet-images', 'pet-images', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket (private - only owner and admin can access)
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'));

-- Storage policies for pet-images bucket (public read, authenticated upload)
CREATE POLICY "Anyone can view pet images"
ON storage.objects FOR SELECT
USING (bucket_id = 'pet-images');

CREATE POLICY "Authenticated users can upload pet images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pet-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own pet images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'pet-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own pet images"
ON storage.objects FOR DELETE
USING (bucket_id = 'pet-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add is_verified column to profiles for shelter/vet verification status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_document_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending';

-- Update RLS policies for adoption_requests to allow general_user to submit
DROP POLICY IF EXISTS "Users can create adoption requests" ON adoption_requests;
CREATE POLICY "Authenticated users can create adoption requests"
ON adoption_requests FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Allow general users and pet owners to view their own adoption requests
DROP POLICY IF EXISTS "Requesters can view their own adoption requests" ON adoption_requests;
CREATE POLICY "Requesters can view their own adoption requests"
ON adoption_requests FOR SELECT
USING (auth.uid() = requester_id);

-- Update injured_reports to allow any authenticated user to create reports
DROP POLICY IF EXISTS "Authenticated users can create injured reports" ON injured_reports;
CREATE POLICY "Authenticated users can create injured reports"
ON injured_reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Update lost_found_reports to ensure only reporter can change status
DROP POLICY IF EXISTS "Users can update their own reports" ON lost_found_reports;
CREATE POLICY "Reporters can update their own lost found reports"
ON lost_found_reports FOR UPDATE
USING (auth.uid() = reporter_id)
WITH CHECK (auth.uid() = reporter_id);

-- Allow admins to view all profiles for verification purposes
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to update profile verification status
CREATE POLICY "Admins can update verification status"
ON profiles FOR UPDATE
USING (has_role(auth.uid(), 'admin'));