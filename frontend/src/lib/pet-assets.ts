import { supabase } from "@/integrations/supabase/client";

type MedicalFileCategory = "medical-card" | "latest-medical";

function sanitizeFileName(fileName: string) {
  return fileName.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
}

function getStoragePath(filePath: string, bucketId: string) {
  const patterns = [
    `/storage/v1/object/public/${bucketId}/`,
    `/storage/v1/object/sign/${bucketId}/`,
    `/storage/v1/object/authenticated/${bucketId}/`,
  ];

  for (const pattern of patterns) {
    const index = filePath.indexOf(pattern);
    if (index >= 0) {
      return decodeURIComponent(filePath.slice(index + pattern.length).split("?")[0]);
    }
  }

  return filePath;
}

export async function uploadPetImage(ownerId: string, file: File) {
  const sanitizedName = sanitizeFileName(file.name);
  const filePath = `${ownerId}/${Date.now()}-${sanitizedName}`;

  const { error: uploadError } = await supabase.storage
    .from("pet-images")
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("pet-images").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadPetMedicalFile(petId: string, category: MedicalFileCategory, file: File) {
  const sanitizedName = sanitizeFileName(file.name);
  const filePath = `${petId}/${category}/${Date.now()}-${sanitizedName}`;

  const { error } = await supabase.storage
    .from("medical-files")
    .upload(filePath, file);

  if (error) {
    throw error;
  }

  return filePath;
}

export async function openPetMedicalFile(filePath: string) {
  const storagePath = getStoragePath(filePath, "medical-files");
  const { data, error } = await supabase.storage
    .from("medical-files")
    .createSignedUrl(storagePath, 60);

  if (error) {
    throw error;
  }

  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}
