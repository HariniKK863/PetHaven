import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PlusCircle, PawPrint, ClipboardCheck, CheckCircle, XCircle, Clock } from "lucide-react";
import { CreatePetDialog } from "./CreatePetDialog";
import { useToast } from "@/hooks/use-toast";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  age: string | null;
  is_for_adoption: boolean;
  status: string;
}

interface AdoptionRequest {
  id: string;
  message: string | null;
  status: string;
  created_at: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  reason: string | null;
  preferred_visit_times: string[] | null;
  approved_visit_time: string | null;
  visit_date: string | null;
  pet_id: string;
  requester_id: string;
  pets: { id: string; name: string; owner_id: string } | null;
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

    const { data: petsData } = await supabase
      .from("pets")
      .select("id, name, species, breed, age, is_for_adoption, status")
      .eq("owner_id", user.id);
    setPets(petsData || []);

    const { data: requestsData } = await supabase
      .from("adoption_requests")
      .select(`
        id, message, status, created_at, full_name, email, phone, address, reason,
        preferred_visit_times, approved_visit_time, visit_date, pet_id, requester_id,
        pets!inner(id, name, owner_id)
      `)
      .order("created_at", { ascending: false });

    const filteredRequests = (requestsData || []).filter(
      (req: any) => req.pets?.owner_id === user.id
    );

    const requestsWithProfiles = await Promise.all(
      filteredRequests.map(async (req: any) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("user_id", req.requester_id)
          .maybeSingle();
        return { ...req, profiles: profile };
      })
    );

    setAdoptionRequests(requestsWithProfiles);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handlePetCreated = () => {
    setShowCreatePet(false);
    fetchData();
    toast({ title: "Pet listed for adoption!" });
  };

  const handleUpdateRequest = async (request: AdoptionRequest, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("adoption_requests")
      .update({ status })
      .eq("id", request.id);

    if (error) {
      toast({ title: "Error updating request", variant: "destructive" });
      return;
    }

    // Update pet status
    const petStatus = status === "approved" ? "adopted" : "available";
    await supabase.from("pets").update({ status: petStatus }).eq("id", request.pet_id);

    // If approved, also update is_for_adoption
    if (status === "approved") {
      await supabase.from("pets").update({ is_for_adoption: false }).eq("id", request.pet_id);
    }

    // Notify the requester
    await supabase.from("notifications").insert({
      user_id: request.requester_id,
      title: status === "approved" ? "Adoption Approved! 🎉" : "Adoption Request Update",
      message: status === "approved"
        ? `Your adoption request for ${request.pets?.name} has been approved! Congratulations!`
        : `Your adoption request for ${request.pets?.name} has been rejected.`,
      type: status === "approved" ? "adoption_approved" : "adoption_rejected",
      related_id: request.pet_id,
    });

    toast({ title: `Request ${status}!` });
    fetchData();
  };

  const handleApproveVisitTime = async (request: AdoptionRequest, time: string) => {
    const { error } = await supabase
      .from("adoption_requests")
      .update({ approved_visit_time: time })
      .eq("id", request.id);

    if (error) {
      toast({ title: "Error approving visit time", variant: "destructive" });
      return;
    }

    await supabase.from("notifications").insert({
      user_id: request.requester_id,
      title: "Shelter Visit Confirmed! 📅",
      message: `Your visit to meet ${request.pets?.name} has been confirmed for ${request.visit_date} at ${time}.`,
      type: "visit_approved",
      related_id: request.pet_id,
    });

    toast({ title: "Visit time approved!" });
    fetchData();
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
                          From: {request.full_name || request.profiles?.full_name || request.profiles?.email || "Unknown"}
                        </CardDescription>
                      </div>
                      <Badge className={
                        request.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        request.status === "approved" ? "bg-green-100 text-green-800" :
                        "bg-red-100 text-red-800"
                      }>
                        {request.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Applicant details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {request.email && <p><span className="font-medium">Email:</span> {request.email}</p>}
                      {request.phone && <p><span className="font-medium">Phone:</span> {request.phone}</p>}
                      {request.address && <p><span className="font-medium">Address:</span> {request.address}</p>}
                    </div>
                    {request.reason && (
                      <div className="text-sm">
                        <span className="font-medium">Reason:</span>
                        <p className="text-muted-foreground mt-1">"{request.reason}"</p>
                      </div>
                    )}
                    {request.message && (
                      <p className="text-sm text-muted-foreground">"{request.message}"</p>
                    )}

                    {/* Visit time approval */}
                    {request.preferred_visit_times && request.preferred_visit_times.length > 0 && (
                      <div className="p-3 rounded-lg border border-border bg-muted/30">
                        <p className="text-sm font-medium mb-2 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Preferred Visit Times ({request.visit_date})
                        </p>
                        {request.approved_visit_time ? (
                          <p className="text-sm text-green-700">✅ Approved: {request.approved_visit_time}</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {request.preferred_visit_times.map((time, i) => (
                              <Button
                                key={i}
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveVisitTime(request, time)}
                              >
                                <CheckCircle className="mr-1 h-3 w-3" />
                                {time}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Approve/Reject buttons */}
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdateRequest(request, "approved")}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleUpdateRequest(request, "rejected")}>
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
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{pet.age && `Age: ${pet.age}`}</p>
                      <Badge variant="outline" className="text-xs">{pet.status}</Badge>
                    </div>
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
