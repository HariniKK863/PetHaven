import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PlusCircle, PawPrint, Heart, Stethoscope } from "lucide-react";
import { CreatePetDialog } from "./CreatePetDialog";
import { CreateTreatmentRequestDialog } from "./CreateTreatmentRequestDialog";
import { useToast } from "@/hooks/use-toast";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  age: string | null;
  is_for_adoption: boolean;
}

interface TreatmentRequest {
  id: string;
  description: string;
  status: string;
  created_at: string;
  pets: { name: string } | null;
}

export function PetOwnerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pets, setPets] = useState<Pet[]>([]);
  const [treatmentRequests, setTreatmentRequests] = useState<TreatmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePet, setShowCreatePet] = useState(false);
  const [showCreateTreatment, setShowCreateTreatment] = useState(false);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    
    // Fetch pets
    const { data: petsData, error: petsError } = await supabase
      .from("pets")
      .select("id, name, species, breed, age, is_for_adoption")
      .eq("owner_id", user.id);

    if (petsError) {
      console.error("Error fetching pets:", petsError);
    } else {
      setPets(petsData || []);
    }

    // Fetch treatment requests
    const { data: treatmentsData, error: treatmentsError } = await supabase
      .from("treatment_requests")
      .select("id, description, status, created_at, pets(name)")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (treatmentsError) {
      console.error("Error fetching treatments:", treatmentsError);
    } else {
      setTreatmentRequests(treatmentsData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handlePetCreated = () => {
    setShowCreatePet(false);
    fetchData();
    toast({ title: "Pet profile created successfully!" });
  };

  const handleTreatmentCreated = () => {
    setShowCreateTreatment(false);
    fetchData();
    toast({ title: "Treatment request submitted!" });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pets">
        <TabsList>
          <TabsTrigger value="pets" className="gap-2">
            <PawPrint className="h-4 w-4" />
            My Pets
          </TabsTrigger>
          <TabsTrigger value="treatments" className="gap-2">
            <Stethoscope className="h-4 w-4" />
            Treatment Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pets" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">My Pets</h2>
            <Button onClick={() => setShowCreatePet(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Pet
            </Button>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : pets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <PawPrint className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pets yet. Add your first pet!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pets.map((pet) => (
                <Card key={pet.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PawPrint className="h-5 w-5 text-primary" />
                      {pet.name}
                    </CardTitle>
                    <CardDescription>
                      {pet.species} {pet.breed && `• ${pet.breed}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {pet.age && `Age: ${pet.age}`}
                    </p>
                    {pet.is_for_adoption && (
                      <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full mt-2">
                        <Heart className="h-3 w-3" />
                        Up for Adoption
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="treatments" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Treatment Requests</h2>
            <Button onClick={() => setShowCreateTreatment(true)} disabled={pets.length === 0}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Request Treatment
            </Button>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : treatmentRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No treatment requests yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {treatmentRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {request.pets?.name || "Unknown Pet"}
                        </CardTitle>
                        <CardDescription>{request.description}</CardDescription>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === "pending" 
                          ? "bg-yellow-100 text-yellow-800" 
                          : request.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreatePetDialog 
        open={showCreatePet} 
        onOpenChange={setShowCreatePet}
        onSuccess={handlePetCreated}
      />
      
      <CreateTreatmentRequestDialog
        open={showCreateTreatment}
        onOpenChange={setShowCreateTreatment}
        onSuccess={handleTreatmentCreated}
        pets={pets}
      />
    </div>
  );
}
