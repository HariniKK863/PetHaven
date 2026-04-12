import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload } from "lucide-react";
import { openPetMedicalFile, uploadPetImage, uploadPetMedicalFile } from "@/lib/pet-assets";

interface CreatePetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isShelter?: boolean;
  petToEdit?: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    age: string | null;
    gender: string | null;
    description: string | null;
    image_url: string | null;
    medical_card_file_path: string | null;
    latest_medical_file_path: string | null;
    shelter_name: string | null;
    location: string | null;
    vaccinated: boolean | null;
    neutered: boolean | null;
  } | null;
}

const buildInitialFormData = (
  isShelter: boolean,
  petToEdit?: CreatePetDialogProps["petToEdit"],
) => ({
  name: petToEdit?.name || "",
  species: petToEdit?.species || "",
  breed: petToEdit?.breed || "",
  age: petToEdit?.age || "",
  gender: petToEdit?.gender || "",
  description: petToEdit?.description || "",
  is_for_adoption: isShelter,
  shelter_name: petToEdit?.shelter_name || "",
  location: petToEdit?.location || "",
  vaccinated: petToEdit?.vaccinated ?? false,
  neutered: petToEdit?.neutered ?? false,
});

export function CreatePetDialog({
  open,
  onOpenChange,
  onSuccess,
  isShelter = false,
  petToEdit = null,
}: CreatePetDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(petToEdit?.image_url || null);
  const [medicalCardFile, setMedicalCardFile] = useState<File | null>(null);
  const [latestMedicalFile, setLatestMedicalFile] = useState<File | null>(null);
  const [formData, setFormData] = useState(buildInitialFormData(isShelter, petToEdit));

  useEffect(() => {
    if (!open) return;

    setFormData(buildInitialFormData(isShelter, petToEdit));
    setImageFile(null);
    setImagePreviewUrl(petToEdit?.image_url || null);
    setMedicalCardFile(null);
    setLatestMedicalFile(null);
  }, [open, isShelter, petToEdit]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(petToEdit?.image_url || null);
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [imageFile, petToEdit?.image_url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const petId = petToEdit?.id || crypto.randomUUID();

    try {
      const imageUrl = imageFile
        ? await uploadPetImage(user.id, imageFile)
        : petToEdit?.image_url || null;

      const petPayload = {
        name: formData.name,
        species: formData.species,
        breed: formData.breed || null,
        age: formData.age || null,
        gender: formData.gender || null,
        description: formData.description || null,
        is_for_adoption: isShelter ? formData.is_for_adoption : false,
        shelter_name: formData.shelter_name || null,
        location: formData.location || null,
        vaccinated: formData.vaccinated,
        neutered: formData.neutered,
        image_url: imageUrl,
      };

      if (petToEdit) {
        let medicalCardFilePath = petToEdit.medical_card_file_path || null;
        let latestMedicalFilePath = petToEdit.latest_medical_file_path || null;

        if (!isShelter && medicalCardFile) {
          medicalCardFilePath = await uploadPetMedicalFile(petId, "medical-card", medicalCardFile);
        }

        if (!isShelter && latestMedicalFile) {
          latestMedicalFilePath = await uploadPetMedicalFile(petId, "latest-medical", latestMedicalFile);
        }

        const { error } = await supabase
          .from("pets")
          .update({
            ...petPayload,
            ...(!isShelter
              ? {
                  medical_card_file_path: medicalCardFilePath,
                  latest_medical_file_path: latestMedicalFilePath,
                }
              : {}),
          })
          .eq("id", petToEdit.id)
          .eq("owner_id", user.id);

        if (error) {
          throw error;
        }
      } else {
        const { error: createError } = await supabase
          .from("pets")
          .insert({
            id: petId,
            owner_id: user.id,
            ...petPayload,
          });

        if (createError) {
          throw createError;
        }

        if (!isShelter && (medicalCardFile || latestMedicalFile)) {
          const medicalUpdates: {
            medical_card_file_path?: string | null;
            latest_medical_file_path?: string | null;
          } = {};

          if (medicalCardFile) {
            medicalUpdates.medical_card_file_path = await uploadPetMedicalFile(petId, "medical-card", medicalCardFile);
          }

          if (latestMedicalFile) {
            medicalUpdates.latest_medical_file_path = await uploadPetMedicalFile(petId, "latest-medical", latestMedicalFile);
          }

          const { error: updateError } = await supabase
            .from("pets")
            .update(medicalUpdates)
            .eq("id", petId)
            .eq("owner_id", user.id);

          if (updateError) {
            throw updateError;
          }
        }
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving pet:", error);
      toast({
        title: petToEdit ? "Unable to update pet" : "Unable to create pet",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewMedicalFile = async (filePath: string | null) => {
    if (!filePath) return;

    try {
      await openPetMedicalFile(filePath);
    } catch (error) {
      console.error("Error opening pet medical file:", error);
      toast({
        title: "Unable to open file",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {petToEdit
              ? "Edit Pet Profile"
              : isShelter
                ? "List Pet for Adoption"
                : "Add Pet Profile"}
          </DialogTitle>
          <DialogDescription>
            {petToEdit
              ? "Update your pet's details and files."
              : isShelter
                ? "Add a new pet to your shelter's adoption listings."
                : "Create a profile for your pet."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {imagePreviewUrl && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src={imagePreviewUrl}
                alt={formData.name || "Pet preview"}
                className="h-48 w-full object-cover"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Pet Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="species">Species *</Label>
            <Select
              value={formData.species}
              onValueChange={(value) => setFormData({ ...formData, species: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select species" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dog">Dog</SelectItem>
                <SelectItem value="Cat">Cat</SelectItem>
                <SelectItem value="Bird">Bird</SelectItem>
                <SelectItem value="Rabbit">Rabbit</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="e.g., 2 years"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => setFormData({ ...formData, gender: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell us about your pet..."
            />
          </div>

          {isShelter && (
            <>
              <div className="space-y-2">
                <Label htmlFor="shelter_name">Shelter Name</Label>
                <Input
                  id="shelter_name"
                  value={formData.shelter_name}
                  onChange={(e) => setFormData({ ...formData, shelter_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="image">Pet Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            <Label
              htmlFor="image"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center hover:bg-muted/50"
            >
              <Upload className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {imageFile || imagePreviewUrl ? "Change pet photo" : "Upload pet photo"}
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, or WEBP images work best for adoption listings.
                </p>
              </div>
            </Label>
            {imageFile && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Upload className="h-3 w-3" />
                {imageFile.name}
              </span>
            )}
          </div>

          {!isShelter && (
            <>
              <div className="space-y-2">
                <Label htmlFor="medical_card">Medical Card File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="medical_card"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => setMedicalCardFile(e.target.files?.[0] || null)}
                  />
                  {medicalCardFile && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Upload className="h-3 w-3" />
                      {medicalCardFile.name}
                    </span>
                  )}
                </div>
                {petToEdit?.medical_card_file_path && !medicalCardFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="px-0"
                    onClick={() => handleViewMedicalFile(petToEdit.medical_card_file_path)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Current Medical Card
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="latest_medical">Latest Medical File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="latest_medical"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => setLatestMedicalFile(e.target.files?.[0] || null)}
                  />
                  {latestMedicalFile && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Upload className="h-3 w-3" />
                      {latestMedicalFile.name}
                    </span>
                  )}
                </div>
                {petToEdit?.latest_medical_file_path && !latestMedicalFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="px-0"
                    onClick={() => handleViewMedicalFile(petToEdit.latest_medical_file_path)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Current Latest Medical File
                  </Button>
                )}
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="vaccinated">Vaccinated</Label>
            <Switch
              id="vaccinated"
              checked={formData.vaccinated}
              onCheckedChange={(checked) => setFormData({ ...formData, vaccinated: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="neutered">Neutered/Spayed</Label>
            <Switch
              id="neutered"
              checked={formData.neutered}
              onCheckedChange={(checked) => setFormData({ ...formData, neutered: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name || !formData.species}>
              {loading ? (petToEdit ? "Saving..." : "Creating...") : (petToEdit ? "Save Changes" : "Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
