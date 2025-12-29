import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PlusCircle, PawPrint, ClipboardCheck, CheckCircle, XCircle } from "lucide-react";
import { CreatePetDialog } from "./CreatePetDialog";
import { useToast } from "@/hooks/use-toast";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  age: string | null;
  is_for_adoption: boolean;
}

interface AdoptionRequest {
  id: string;
  message: string | null;
  status: string;
  created_at: string;
  pets: { id: string; name: string } | null;
  profiles: { full_name: string | null; email: string | null } | null;
}

export function ShelterDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pets, setPets] = useState<Pet[]>([]);
  const [adoptionRequests, setAdoptionRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePet, setShowCreatePet] = useState(false);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);

    // Fetch shelter's pets
    const { data: petsData, error: petsError } = await supabase
      .from("pets")
      .select("id, name, species, breed, age, is_for_adoption")
      .eq("owner_id", user.id);

    if (petsError) {
      console.error("Error fetching pets:", petsError);
    } else {
      setPets(petsData || []);
    }

    // Fetch adoption requests for shelter's pets
    const { data: requestsData, error: requestsError } = await supabase
      .from("adoption_requests")
      .select(`
        id, 
        message, 
        status, 
        created_at,
        pets!inner(id, name, owner_id),
        requester_id
      `)
      .order("created_at", { ascending: false });

    if (requestsError) {
      console.error("Error fetching adoption requests:", requestsError);
    } else {
      // Filter for shelter's pets and fetch requester profiles
      const filteredRequests = (requestsData || []).filter(
        (req: any) => req.pets?.owner_id === user.id
      );
      
      // Fetch profiles for requesters
      const requestsWithProfiles = await Promise.all(
        filteredRequests.map(async (req: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("user_id", req.requester_id)
            .maybeSingle();
          
          return {
            ...req,
            profiles: profile
          };
        })
      );
      
      setAdoptionRequests(requestsWithProfiles);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handlePetCreated = () => {
    setShowCreatePet(false);
    fetchData();
    toast({ title: "Pet listed for adoption!" });
  };

  const handleUpdateRequest = async (requestId: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("adoption_requests")
      .update({ status })
      .eq("id", requestId);

    if (error) {
      toast({ title: "Error updating request", variant: "destructive" });
    } else {
      toast({ title: `Request ${status}!` });
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Adoption Requests
          </TabsTrigger>
          <TabsTrigger value="pets" className="gap-2">
            <PawPrint className="h-4 w-4" />
            Listed Pets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Adoption Requests</h2>

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : adoptionRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No adoption requests yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {adoptionRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Request for {request.pets?.name || "Unknown Pet"}
                        </CardTitle>
                        <CardDescription>
                          From: {request.profiles?.full_name || request.profiles?.email || "Unknown"}
                        </CardDescription>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : request.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {request.message && (
                      <p className="text-sm text-muted-foreground mb-4">
                        "{request.message}"
                      </p>
                    )}
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateRequest(request.id, "approved")}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateRequest(request.id, "rejected")}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pets" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Listed Pets</h2>
            <Button onClick={() => setShowCreatePet(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              List Pet
            </Button>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : pets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <PawPrint className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pets listed yet.</p>
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
                  </CardContent>
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
        isShelter={true}
      />
    </div>
  );
}
