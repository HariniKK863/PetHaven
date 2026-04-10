import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Stethoscope, MapPin, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface VetProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  organization_name: string | null;
  address: string | null;
}

interface VetSlot {
  id: string;
  slot_date: string;
  slot_time: string;
}

export default function VetServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [vets, setVets] = useState<VetProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVet, setSelectedVet] = useState<VetProfile | null>(null);
  const [slots, setSlots] = useState<VetSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<VetSlot | null>(null);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [petName, setPetName] = useState("");
  const [reason, setReason] = useState("");
  const [userPets, setUserPets] = useState<{ id: string; name: string }[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const { toast } = useToast();
  const { user, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVets = async () => {
      // Get all verified vets
      const { data: vetRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "veterinarian");

      if (!vetRoles || vetRoles.length === 0) {
        setLoading(false);
        return;
      }

      const vetIds = vetRoles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, organization_name, address")
        .in("user_id", vetIds)
        .eq("verification_status", "approved");

      setVets(profiles || []);
      setLoading(false);
    };
    fetchVets();
  }, []);

  // Fetch user's pets for booking
  useEffect(() => {
    if (user) {
      supabase.from("pets").select("id, name").eq("owner_id", user.id).then(({ data }) => {
        setUserPets(data || []);
      });
    }
  }, [user]);

  const fetchSlots = async (vetId: string) => {
    setSlotsLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("vet_slots")
      .select("id, slot_date, slot_time")
      .eq("vet_id", vetId)
      .eq("is_booked", false)
      .gte("slot_date", today)
      .order("slot_date")
      .order("slot_time");
    setSlots(data || []);
    setSlotsLoading(false);
  };

  const handleSelectVet = (vet: VetProfile) => {
    if (!user) {
      toast({ title: "Please log in", variant: "destructive" });
      navigate("/login");
      return;
    }
    if (role === "veterinarian") {
      toast({ title: "Veterinarians cannot book appointments with other vets.", variant: "destructive" });
      return;
    }
    setSelectedVet(vet);
    setShowBookDialog(true);
    fetchSlots(vet.user_id);
  };

  const handleBookAppointment = async () => {
    if (!user || !selectedVet || !selectedSlot) return;

    const { error } = await supabase.from("vet_appointments").insert({
      vet_id: selectedVet.user_id,
      user_id: user.id,
      pet_id: selectedPetId || null,
      slot_id: selectedSlot.id,
      appointment_date: selectedSlot.slot_date,
      appointment_time: selectedSlot.slot_time,
      reason,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to book appointment.", variant: "destructive" });
      return;
    }

    // Mark slot as booked
    await supabase.from("vet_slots").update({ is_booked: true }).eq("id", selectedSlot.id);

    // Notify vet
    await supabase.from("notifications").insert({
      user_id: selectedVet.user_id,
      title: "New Appointment Request",
      message: `A new appointment has been requested for ${selectedSlot.slot_date} at ${selectedSlot.slot_time}.`,
      type: "appointment_request",
    });

    toast({ title: "Appointment Requested!", description: "The vet will confirm your appointment." });
    setShowBookDialog(false);
    setSelectedSlot(null);
    setReason("");
    setSelectedPetId("");
  };

  const filteredVets = vets.filter((vet) => {
    return (vet.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vet.organization_name || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Layout>
      <section className="bg-gradient-to-b from-primary/10 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary rounded-full p-2">
              <Stethoscope className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Veterinary Services</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Find verified veterinarians and book appointments from their available slots.
          </p>
        </div>
      </section>

      <section className="py-6 border-b border-border sticky top-16 bg-background/95 backdrop-blur-sm z-40">
        <div className="container mx-auto px-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or clinic..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <p className="text-center text-muted-foreground">Loading veterinarians...</p>
          ) : filteredVets.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No verified veterinarians found</h3>
              <p className="text-muted-foreground">Check back later for available vets.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredVets.map((vet) => (
                <Card key={vet.user_id}>
                  <CardHeader className="pb-4">
                    <div className="flex gap-4 items-start">
                      <div className="bg-primary/10 rounded-full p-3">
                        <Stethoscope className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-foreground">{vet.full_name || "Veterinarian"}</h3>
                        {vet.organization_name && <p className="text-sm text-muted-foreground">{vet.organization_name}</p>}
                        {vet.address && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />{vet.address}
                          </div>
                        )}
                        <Badge variant="secondary" className="mt-2 text-xs">Verified</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardFooter className="pt-0">
                    <Button className="w-full" onClick={() => handleSelectVet(vet)}>
                      <Calendar className="mr-2 h-4 w-4" />Book Appointment
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Select an available time slot with {selectedVet?.full_name || "the vet"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {userPets.length > 0 && (
              <div className="space-y-2">
                <Label>Select Your Pet</Label>
                <Select value={selectedPetId} onValueChange={setSelectedPetId}>
                  <SelectTrigger><SelectValue placeholder="Choose a pet (optional)" /></SelectTrigger>
                  <SelectContent>
                    {userPets.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Reason for Visit</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe the reason..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Available Slots</Label>
              {slotsLoading ? (
                <p className="text-sm text-muted-foreground">Loading slots...</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No available slots. The vet hasn't added any yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {slots.map((slot) => (
                    <Button
                      key={slot.id}
                      variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                      size="sm"
                      className="justify-start"
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot.slot_date} at {slot.slot_time}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowBookDialog(false)}>Cancel</Button>
              <Button onClick={handleBookAppointment} disabled={!selectedSlot}>
                Request Appointment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
