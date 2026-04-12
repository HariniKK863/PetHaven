import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, ClipboardList, Heart, ImageIcon, MapPin, PawPrint } from "lucide-react";

interface AdoptionRequest {
  id: string;
  status: string;
  created_at: string;
  preferred_visit_times: string[] | null;
  approved_visit_time: string | null;
  visit_date: string | null;
  pet_name: string | null;
  pet_species: string | null;
  pet_breed: string | null;
  pet_age: string | null;
  pet_image_url: string | null;
  pet_shelter_name: string | null;
  pet_location: string | null;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string | null;
  status: string;
  medical_notes: string | null;
  pet_name?: string;
  vet_name?: string;
}

interface MedicalRecord {
  id: string;
  diagnosis: string;
  treatment: string;
  notes: string | null;
  record_date: string;
  pet_name?: string;
  vet_name?: string;
}

export function GeneralUserDashboardV2() {
  const { user } = useAuth();
  const [adoptionRequests, setAdoptionRequests] = useState<AdoptionRequest[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data: requests } = await supabase
        .from("adoption_requests")
        .select("id, status, created_at, preferred_visit_times, approved_visit_time, visit_date, pet_name, pet_species, pet_breed, pet_age, pet_image_url, pet_shelter_name, pet_location")
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false });

      setAdoptionRequests(requests || []);

      const { data: appts } = await supabase
        .from("vet_appointments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (appts) {
        const enrichedAppointments = await Promise.all(
          appts.map(async (appointment: any) => {
            const { data: vetProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", appointment.vet_id)
              .maybeSingle();

            let petName = null;
            if (appointment.pet_id) {
              const { data: pet } = await supabase
                .from("pets")
                .select("name")
                .eq("id", appointment.pet_id)
                .maybeSingle();
              petName = pet?.name;
            }

            return {
              ...appointment,
              vet_name: vetProfile?.full_name,
              pet_name: petName,
            };
          }),
        );

        setAppointments(enrichedAppointments);
      }

      const { data: userPets } = await supabase
        .from("pets")
        .select("id, name")
        .eq("owner_id", user.id);

      if (userPets && userPets.length > 0) {
        const petIds = userPets.map((pet) => pet.id);
        const { data: records } = await supabase
          .from("medical_records")
          .select("*")
          .in("pet_id", petIds)
          .order("record_date", { ascending: false });

        if (records) {
          const enrichedRecords = await Promise.all(
            records.map(async (record: any) => {
              const pet = userPets.find((userPet) => userPet.id === record.pet_id);
              const { data: vetProfile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("user_id", record.vet_id)
                .maybeSingle();

              return {
                ...record,
                pet_name: pet?.name,
                vet_name: vetProfile?.full_name,
              };
            }),
          );

          setMedicalRecords(enrichedRecords);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="adoptions">
        <TabsList>
          <TabsTrigger value="adoptions" className="gap-2">
            <Heart className="h-4 w-4" />
            My Adoptions
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="records" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Medical Records
          </TabsTrigger>
        </TabsList>

        <TabsContent value="adoptions" className="mt-6">
          <h2 className="mb-4 text-xl font-semibold">My Adoption Requests</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : adoptionRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No adoption requests yet. Browse pets to get started!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {adoptionRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted">
                    {request.pet_image_url ? (
                      <img
                        src={request.pet_image_url}
                        alt={request.pet_name || "Pet"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">{request.pet_name || "Adopted Pet"}</CardTitle>
                        <CardDescription className="mt-1">
                          {[request.pet_species, request.pet_breed].filter(Boolean).join(" - ") || "Pet details unavailable"}
                        </CardDescription>
                      </div>
                      <Badge
                        className={
                          request.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : request.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-muted/40 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Requested On</p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {request.pet_age && (
                        <div className="rounded-lg bg-muted/40 p-3">
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <PawPrint className="h-4 w-4 text-muted-foreground" />
                            <span>Age: {request.pet_age}</span>
                          </div>
                        </div>
                      )}
                      {(request.pet_location || request.pet_shelter_name) && (
                        <div className="rounded-lg bg-muted/40 p-3 sm:col-span-2">
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{request.pet_location || request.pet_shelter_name}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {request.approved_visit_time && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                        Visit confirmed: {request.visit_date} at {request.approved_visit_time}
                      </div>
                    )}
                    {request.preferred_visit_times && request.preferred_visit_times.length > 0 && !request.approved_visit_time && (
                      <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                        Your visit slots are submitted. Waiting for shelter approval.
                      </div>
                    )}
                    {request.status === "approved" && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
                        Adoption approved.
                      </div>
                    )}
                    {!request.pet_name && !request.pet_species && !request.pet_image_url && (
                      <p className="text-sm text-muted-foreground">
                        Pet details will appear here after the latest database migration is applied.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="appointments" className="mt-6">
          <h2 className="mb-4 text-xl font-semibold">My Vet Appointments</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : appointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No appointments yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {appointment.appointment_date} at {appointment.appointment_time}
                        </CardTitle>
                        <CardDescription>
                          Vet: {appointment.vet_name || "Unknown"} {appointment.pet_name ? `- Pet: ${appointment.pet_name}` : ""}
                        </CardDescription>
                      </div>
                      <Badge
                        className={
                          appointment.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : appointment.status === "approved"
                              ? "bg-blue-100 text-blue-800"
                              : appointment.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                        }
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  {appointment.medical_notes && (
                    <CardContent>
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-sm font-medium">Medical Notes:</p>
                        <p className="text-sm text-muted-foreground">{appointment.medical_notes}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="records" className="mt-6">
          <h2 className="mb-4 text-xl font-semibold">Medical Records</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : medicalRecords.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No medical records yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {medicalRecords.map((record) => (
                <Card key={record.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {record.pet_name || "Pet"} - {record.record_date}
                    </CardTitle>
                    <CardDescription>Vet: {record.vet_name || "Unknown"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Diagnosis:</span> {record.diagnosis}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Treatment:</span> {record.treatment}
                    </p>
                    {record.notes && <p className="text-sm text-muted-foreground">{record.notes}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
