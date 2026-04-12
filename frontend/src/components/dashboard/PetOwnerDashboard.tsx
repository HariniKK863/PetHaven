import { useEffect, useState } from "react";
import { CheckCircle, FileText, Pencil, PlusCircle, PawPrint, Stethoscope, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CreatePetDialog } from "./CreatePetDialog";
import { useToast } from "@/hooks/use-toast";
import { openPetMedicalFile } from "@/lib/pet-assets";

interface Pet {
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
}

export function PetOwnerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePet, setShowCreatePet] = useState(false);
  const [petBeingEdited, setPetBeingEdited] = useState<Pet | null>(null);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);

    const { data: petsData, error: petsError } = await supabase
      .from("pets")
      .select("id, name, species, breed, age, gender, description, image_url, medical_card_file_path, latest_medical_file_path, shelter_name, location, vaccinated, neutered")
      .eq("owner_id", user.id);

    if (petsError) {
      console.error("Error fetching pets:", petsError);
    } else {
      setPets(petsData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handlePetCreated = () => {
    setShowCreatePet(false);
    setPetBeingEdited(null);
    fetchData();
    toast({ title: petBeingEdited ? "Pet profile updated successfully!" : "Pet profile created successfully!" });
  };

  const handleRemovePet = async (petId: string, petName: string) => {
    const confirmed = window.confirm(`Remove ${petName}'s profile from your list?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from("pets")
      .delete()
      .eq("id", petId)
      .eq("owner_id", user.id);

    if (error) {
      console.error("Error deleting pet:", error);
      toast({
        title: "Unable to remove pet",
        description: "Please try again.",
        variant: "destructive",
      });
      return;
    }

    setPets((currentPets) => currentPets.filter((pet) => pet.id !== petId));
    toast({ title: "Pet profile removed" });
  };

  const handleViewMedicalFile = async (filePath: string) => {
    try {
      await openPetMedicalFile(filePath);
    } catch (error) {
      console.error("Error opening medical file:", error);
      toast({
        title: "Unable to open file",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-3 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-medium text-foreground">Vet bookings now happen only through vet timings.</p>
            <p className="text-sm text-muted-foreground">
              Use the Vet Services page to choose from a veterinarian's available slots. Injured animals should be reported from the Report Injured page.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" asChild>
              <a href="/report-injured">
                <Stethoscope className="mr-2 h-4 w-4" />
                Report Injured
              </a>
            </Button>
            <Button type="button" asChild>
              <a href="/vet-services">
                <Stethoscope className="mr-2 h-4 w-4" />
                Book Vet Slot
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Pets</h2>
        <Button onClick={() => {
          setPetBeingEdited(null);
          setShowCreatePet(true);
        }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Pet
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : pets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PawPrint className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No pets yet. Add your first pet!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet) => (
            <Card key={pet.id}>
              <div className="aspect-video overflow-hidden rounded-t-lg bg-muted">
                <img
                  src={pet.image_url || "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=360&fit=crop"}
                  alt={pet.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PawPrint className="h-5 w-5 text-primary" />
                  {pet.name}
                </CardTitle>
                <CardDescription>
                  {pet.species} {pet.breed && `- ${pet.breed}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{pet.age && `Age: ${pet.age}`}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {pet.gender && <span>{pet.gender}</span>}
                  {pet.vaccinated && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-primary">
                      <CheckCircle className="h-3 w-3" />
                      Vaccinated
                    </span>
                  )}
                  {pet.neutered && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-primary">
                      <CheckCircle className="h-3 w-3" />
                      Neutered/Spayed
                    </span>
                  )}
                </div>
                {pet.description && (
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {pet.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {pet.medical_card_file_path && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewMedicalFile(pet.medical_card_file_path!)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Medical Card
                    </Button>
                  )}
                  {pet.latest_medical_file_path && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewMedicalFile(pet.latest_medical_file_path!)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Latest Medical File
                    </Button>
                  )}
                </div>
                <div className="grid gap-2 pt-2 md:grid-cols-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setPetBeingEdited(pet);
                      setShowCreatePet(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemovePet(pet.id, pet.name)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreatePetDialog
        open={showCreatePet}
        onOpenChange={(open) => {
          setShowCreatePet(open);
          if (!open) {
            setPetBeingEdited(null);
          }
        }}
        onSuccess={handlePetCreated}
        petToEdit={petBeingEdited}
      />
    </div>
  );
}
