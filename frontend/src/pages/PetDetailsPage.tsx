import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart, MapPin, Calendar, CheckCircle, ArrowLeft, PawPrint,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AdoptionRequestDialog } from "@/components/adoption/AdoptionRequestDialog";
import { VisitBookingDialog } from "@/components/adoption/VisitBookingDialog";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  age: string | null;
  gender: string | null;
  description: string | null;
  image_url: string | null;
  location: string | null;
  shelter_name: string | null;
  vaccinated: boolean | null;
  neutered: boolean | null;
  owner_id: string;
  status: string;
}

export default function PetDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdoptDialog, setShowAdoptDialog] = useState(false);
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);

  useEffect(() => {
    const fetchPet = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) console.error("Error fetching pet:", error);
      setPet(data);
      setLoading(false);
    };
    fetchPet();
  }, [id]);

  // Check if user already has an adoption request for this pet
  useEffect(() => {
    const checkExistingRequest = async () => {
      if (!user || !id) return;
      const { data } = await supabase
        .from("adoption_requests")
        .select("*")
        .eq("pet_id", id)
        .eq("requester_id", user.id)
        .maybeSingle();
      setExistingRequest(data);
    };
    checkExistingRequest();
  }, [user, id]);

  const handleAdoptionSuccess = () => {
    setShowAdoptDialog(false);
    // Refresh existing request
    if (user && id) {
      supabase
        .from("adoption_requests")
        .select("*")
        .eq("pet_id", id)
        .eq("requester_id", user.id)
        .maybeSingle()
        .then(({ data }) => setExistingRequest(data));
    }
    // Refresh pet data
    if (id) {
      supabase
        .from("pets")
        .select("*")
        .eq("id", id)
        .maybeSingle()
        .then(({ data }) => { if (data) setPet(data); });
    }
  };

  const handleVisitSuccess = () => {
    setShowVisitDialog(false);
    if (user && id) {
      supabase
        .from("adoption_requests")
        .select("*")
        .eq("pet_id", id)
        .eq("requester_id", user.id)
        .maybeSingle()
        .then(({ data }) => setExistingRequest(data));
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!pet) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <PawPrint className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">Pet Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This pet may no longer be available for adoption.
          </p>
          <Button onClick={() => navigate("/adopt")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Adoption
          </Button>
        </div>
      </Layout>
    );
  }

  const statusColors: Record<string, string> = {
    available: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    adopted: "bg-muted text-muted-foreground",
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/adopt")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Adoption
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="relative aspect-square rounded-lg overflow-hidden">
            <img
              src={pet.image_url || "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=600&fit=crop"}
              alt={pet.name}
              className="w-full h-full object-cover"
            />
            <Badge className={`absolute top-4 left-4 ${statusColors[pet.status] || ""}`}>
              {pet.status.charAt(0).toUpperCase() + pet.status.slice(1)}
            </Badge>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{pet.name}</h1>
                <Badge variant="outline">{pet.species}</Badge>
              </div>
              {pet.breed && <p className="text-lg text-muted-foreground">{pet.breed}</p>}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {pet.age && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /><span>{pet.age}</span>
                </div>
              )}
              {pet.gender && <div className="flex items-center gap-1"><span>{pet.gender}</span></div>}
              {pet.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /><span>{pet.location}</span>
                </div>
              )}
            </div>

            {pet.shelter_name && (
              <Card>
                <CardContent className="py-4">
                  <p className="text-sm text-muted-foreground">Shelter</p>
                  <p className="font-medium">{pet.shelter_name}</p>
                </CardContent>
              </Card>
            )}

            {pet.description && (
              <div>
                <h2 className="font-semibold mb-2">About {pet.name}</h2>
                <p className="text-muted-foreground">{pet.description}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {pet.vaccinated && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="h-3 w-3" />Vaccinated
                </Badge>
              )}
              {pet.neutered && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="h-3 w-3" />Neutered/Spayed
                </Badge>
              )}
            </div>

            {/* Action buttons based on state */}
            {pet.status === "available" && !existingRequest && (
              <Button size="lg" className="w-full" onClick={() => {
                if (!user) {
                  toast({ title: "Please log in", description: "You need to be logged in to request adoption.", variant: "destructive" });
                  navigate("/login");
                  return;
                }
                setShowAdoptDialog(true);
              }}>
                <Heart className="mr-2 h-5 w-5" />
                Request for Adoption
              </Button>
            )}

            {existingRequest && existingRequest.status === "pending" && (
              <div className="space-y-3">
                <Badge className="bg-yellow-100 text-yellow-800 text-sm px-4 py-2">
                  Adoption Request Pending
                </Badge>
                {(!existingRequest.preferred_visit_times || existingRequest.preferred_visit_times.length === 0) && (
                  <Button size="lg" className="w-full" variant="outline" onClick={() => setShowVisitDialog(true)}>
                    <Calendar className="mr-2 h-5 w-5" />
                    Book Shelter Visit
                  </Button>
                )}
                {existingRequest.preferred_visit_times && existingRequest.preferred_visit_times.length > 0 && (
                  <div className="p-4 rounded-lg border border-border bg-muted/50">
                    <p className="text-sm font-medium mb-2">Visit Times Submitted</p>
                    {existingRequest.approved_visit_time ? (
                      <p className="text-sm text-green-700">
                        ✅ Approved: {existingRequest.approved_visit_time} on {existingRequest.visit_date}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Waiting for shelter approval...</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {existingRequest && existingRequest.status === "approved" && (
              <Badge className="bg-green-100 text-green-800 text-sm px-4 py-2">
                ✅ Adoption Approved!
              </Badge>
            )}

            {existingRequest && existingRequest.status === "rejected" && (
              <Badge className="bg-red-100 text-red-800 text-sm px-4 py-2">
                ❌ Adoption Request Rejected
              </Badge>
            )}

            {pet.status === "adopted" && !existingRequest && (
              <Badge className="bg-muted text-muted-foreground text-sm px-4 py-2">
                This pet has been adopted
              </Badge>
            )}
          </div>
        </div>
      </div>

      {pet && user && (
        <>
          <AdoptionRequestDialog
            open={showAdoptDialog}
            onOpenChange={setShowAdoptDialog}
            pet={pet}
            userId={user.id}
            onSuccess={handleAdoptionSuccess}
          />
          {existingRequest && (
            <VisitBookingDialog
              open={showVisitDialog}
              onOpenChange={setShowVisitDialog}
              requestId={existingRequest.id}
              petName={pet.name}
              onSuccess={handleVisitSuccess}
            />
          )}
        </>
      )}
    </Layout>
  );
}
