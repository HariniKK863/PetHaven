import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PlusCircle, PawPrint, ClipboardCheck, CheckCircle, XCircle, Clock, ImageIcon } from "lucide-react";
import { CreatePetDialog } from "./CreatePetDialog";
import { useToast } from "@/hooks/use-toast";
import { formatIndianPhone } from "@/lib/phone";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  age: string | null;
  is_for_adoption: boolean;
  status: string;
  image_url: string | null;
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
  pet_name: string | null;
  pet_species: string | null;
  pet_breed: string | null;
  pet_age: string | null;
  pet_image_url: string | null;
  pet_location: string | null;
  pet_shelter_name: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
}

export function ShelterDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pets, setPets] = useState<Pet[]>([]);
  const [adoptionRequests, setAdoptionRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePet, setShowCreatePet] = useState(false);

  const formatVisitTime = (time: string) => {
    const [hours = "0", minutes = "0"] = time.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);

    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: petsData } = await supabase
      .from("pets")
      .select("id, name, species, breed, age, is_for_adoption, status, image_url")
      .eq("owner_id", user.id);
    setPets(petsData || []);

    const { data: requestsData } = await supabase
      .from("adoption_requests")
      .select(`
        id, message, status, created_at, full_name, email, phone, address, reason,
        preferred_visit_times, approved_visit_time, visit_date, pet_id, requester_id,
        pet_name, pet_species, pet_breed, pet_age, pet_image_url, pet_location, pet_shelter_name
      `)
      .eq("shelter_id", user.id)
      .order("created_at", { ascending: false });

    const requestsWithProfiles = await Promise.all(
      (requestsData || []).map(async (req: any) => {
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
      message: `Your visit to meet ${request.pet_name || "the pet"} has been confirmed for ${request.visit_date} at ${time}.`,
      type: "visit_approved",
      related_id: request.pet_id,
    });

    toast({ title: "Visit time approved!" });
    fetchData();
  };

  const handleUpdateRequest = async (request: AdoptionRequest, status: "approved" | "rejected") => {
    if (
      status === "approved" &&
      (!request.visit_date || !request.preferred_visit_times?.length || !request.approved_visit_time)
    ) {
      toast({
        title: "Approve a visit slot first",
        description: "Choose one of the user's preferred shelter-visit times before approving the adoption.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("adoption_requests")
      .update({ status })
      .eq("id", request.id);

    if (error) {
      toast({ title: "Error updating request", variant: "destructive" });
      return;
    }

    const petStatus = status === "approved" ? "adopted" : "available";
    await supabase.from("pets").update({ status: petStatus }).eq("id", request.pet_id);

    if (status === "approved") {
      await supabase.from("pets").update({ is_for_adoption: false }).eq("id", request.pet_id);
    }

    await supabase.from("notifications").insert({
      user_id: request.requester_id,
      title: status === "approved" ? "Adoption Approved! 🎉" : "Adoption Request Update",
      message: status === "approved"
        ? `Your adoption request for ${request.pet_name || "the pet"} has been approved! Congratulations!`
        : `Your adoption request for ${request.pet_name || "the pet"} has been rejected.`,
      type: status === "approved" ? "adoption_approved" : "adoption_rejected",
      related_id: request.pet_id,
    });

    toast({ title: `Request ${status}!` });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />Adoption Requests
          </TabsTrigger>
          <TabsTrigger value="pets" className="gap-2">
            <PawPrint className="h-4 w-4" />Listed Pets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Adoption Requests</h2>
          {loading ? <p className="text-muted-foreground">Loading...</p> : adoptionRequests.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No adoption requests yet.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {adoptionRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="h-20 w-20 overflow-hidden rounded-lg bg-muted">
                          {request.pet_image_url ? (
                            <img
                              src={request.pet_image_url}
                              alt={request.pet_name || "Pet"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <ImageIcon className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">Request for {request.pet_name || "Unknown Pet"}</CardTitle>
                          <CardDescription>
                            From: {request.full_name || request.profiles?.full_name || request.profiles?.email || "Unknown"}
                          </CardDescription>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {[request.pet_species, request.pet_breed].filter(Boolean).join(" - ") || "Pet details pending"}
                          </p>
                        </div>
                      </div>
                      <Badge className={
                        request.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        request.status === "approved" ? "bg-green-100 text-green-800" :
                        "bg-red-100 text-red-800"
                      }>{request.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {request.email && <p><span className="font-medium">Email:</span> {request.email}</p>}
                      {request.phone && <p><span className="font-medium">Phone:</span> {formatIndianPhone(request.phone)}</p>}
                      {request.address && <p><span className="font-medium">Address:</span> {request.address}</p>}
                    </div>
                    {request.reason && (
                      <div className="text-sm">
                        <span className="font-medium">Reason:</span>
                        <p className="text-muted-foreground mt-1">"{request.reason}"</p>
                      </div>
                    )}
                    {request.message && <p className="text-sm text-muted-foreground">"{request.message}"</p>}

                    {request.preferred_visit_times && request.preferred_visit_times.length > 0 && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <p className="mb-1 flex items-center gap-1 text-sm font-semibold">
                          <Clock className="h-4 w-4" />
                          Shelter Visit Approval
                        </p>
                        <p className="mb-3 text-sm text-muted-foreground">
                          {request.visit_date
                            ? `Requested date: ${request.visit_date}. Approve one of these preferred slots first.`
                            : "Approve one of these preferred shelter-visit slots first."}
                        </p>
                        {request.approved_visit_time ? (
                          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                            Visit approved for {formatVisitTime(request.approved_visit_time)}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {request.preferred_visit_times.map((time, i) => (
                              <Button key={i} size="sm" onClick={() => handleApproveVisitTime(request, time)}>
                                <CheckCircle className="mr-1 h-3 w-3" />Approve {formatVisitTime(time)}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {!request.preferred_visit_times?.length && request.status === "pending" && (
                      <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                        Waiting for the adopter to submit 3 preferred shelter-visit time slots.
                      </div>
                    )}

                    {request.status === "pending" && (
                      <div className="space-y-2">
                        {!request.approved_visit_time && (
                          <p className="text-sm text-muted-foreground">
                            Approve one of the requested visit slots before approving the adoption.
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateRequest(request, "approved")}
                            disabled={!request.approved_visit_time}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />Approve Adoption
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleUpdateRequest(request, "rejected")}>
                            <XCircle className="mr-2 h-4 w-4" />Reject
                          </Button>
                        </div>
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
              <PlusCircle className="mr-2 h-4 w-4" />List Pet
            </Button>
          </div>
          {loading ? <p className="text-muted-foreground">Loading...</p> : pets.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <PawPrint className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No pets listed yet.</p>
            </CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pets.map((pet) => (
                <Card key={pet.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted">
                    {pet.image_url ? (
                      <img
                        src={pet.image_url}
                        alt={pet.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PawPrint className="h-5 w-5 text-primary" />{pet.name}
                    </CardTitle>
                    <CardDescription>{pet.species} {pet.breed && `• ${pet.breed}`}</CardDescription>
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

      <CreatePetDialog open={showCreatePet} onOpenChange={setShowCreatePet} onSuccess={handlePetCreated} isShelter={true} />
    </div>
  );
}
