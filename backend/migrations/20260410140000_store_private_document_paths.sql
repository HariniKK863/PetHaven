UPDATE public.profiles
SET verification_document_url = substring(verification_document_url FROM '/documents/(.+)$')
WHERE verification_document_url LIKE '%/documents/%';
