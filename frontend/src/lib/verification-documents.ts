import { supabase } from "@/integrations/supabase/client";

const DOCUMENT_URL_PATTERNS = [
  "/storage/v1/object/public/documents/",
  "/storage/v1/object/sign/documents/",
  "/storage/v1/object/authenticated/documents/",
];

export function getVerificationDocumentPath(documentRef: string) {
  for (const pattern of DOCUMENT_URL_PATTERNS) {
    const index = documentRef.indexOf(pattern);
    if (index >= 0) {
      const path = documentRef.slice(index + pattern.length).split("?")[0];
      return decodeURIComponent(path);
    }
  }

  return documentRef;
}

export async function openVerificationDocument(documentRef: string) {
  const documentPath = getVerificationDocumentPath(documentRef);
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(documentPath, 60);

  if (error) {
    throw error;
  }

  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}
