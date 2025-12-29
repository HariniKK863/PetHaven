import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Heart,
  MapPin,
  Calendar,
  CheckCircle,
  ArrowLeft,
  PawPrint,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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
}

export default function PetDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdoptDialog, setShowAdoptDialog] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPet = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("id", id)
        .eq("is_for_adoption", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching pet:", error);
      }
      setPet(data);
      setLoading(false);
    };

    fetchPet();
  }, [id]);

  const handleAdoptionRequest = async () => {
    if (!user || !pet) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to submit an adoption request.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("adoption_requests").insert({
      pet_id: pet.id,
      requester_id: user.id,
      shelter_id: pet.owner_id,
      message: message || null,
    });

    setSubmitting(false);

    if (error) {
      console.error("Error submitting adoption request:", error);
      toast({
        title: "Error",
        description: "Failed to submit adoption request. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Request Submitted!",
        description: "Your adoption request has been sent to the shelter.",
      });
      setShowAdoptDialog(false);
      setMessage("");
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/adopt")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Adoption
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pet Image */}
          <div className="relative aspect-square rounded-lg overflow-hidden">
            <img
              src={
                pet.image_url ||
                "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=600&fit=crop"
              }
              alt={pet.name}
              className="w-full h-full object-cover"
            />
            <button className="absolute top-4 right-4 p-3 bg-card/80 backdrop-blur-sm rounded-full hover:bg-primary hover:text-primary-foreground transition-colors">
              <Heart className="h-6 w-6" />
            </button>
          </div>

          {/* Pet Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{pet.name}</h1>
                <Badge variant="outline">{pet.species}</Badge>
              </div>
              {pet.breed && (
                <p className="text-lg text-muted-foreground">{pet.breed}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {pet.age && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{pet.age}</span>
                </div>
              )}
              {pet.gender && (
                <div className="flex items-center gap-1">
                  <span>{pet.gender}</span>
                </div>
              )}
              {pet.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{pet.location}</span>
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
                  <CheckCircle className="h-3 w-3" />
                  Vaccinated
                </Badge>
              )}
              {pet.neutered && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Neutered/Spayed
                </Badge>
              )}
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={() => setShowAdoptDialog(true)}
            >
              <Heart className="mr-2 h-5 w-5" />
              Request to Adopt {pet.name}
            </Button>
          </div>
        </div>
      </div>

      {/* Adoption Request Dialog */}
      <Dialog open={showAdoptDialog} onOpenChange={setShowAdoptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adopt {pet.name}</DialogTitle>
            <DialogDescription>
              Send an adoption request to the shelter. They will review your
              request and get back to you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">
                Message to Shelter (Optional)
              </Label>
              <Textarea
                id="message"
                placeholder="Tell the shelter a bit about yourself and why you'd like to adopt this pet..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAdoptDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAdoptionRequest} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
