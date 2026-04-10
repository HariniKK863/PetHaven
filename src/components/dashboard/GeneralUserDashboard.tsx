import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, Calendar, ClipboardList } from "lucide-react";

interface AdoptionRequest {
  id: string;
  status: string;
  created_at: string;
  preferred_visit_times: string[] | null;
  approved_visit_time: string | null;
  visit_date: string | null;
  pets: { name: string } | null;
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

export function GeneralUserDashboard() {
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
        .select("id, status, created_at, preferred_visit_times, approved_visit_time, visit_date, pets(name)")
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false });
      setAdoptionRequests(requests || []);

      const { data: appts } = await supabase
        .from("vet_appointments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (appts) {
        const enriched = await Promise.all(
          appts.map(async (a: any) => {
            const { data: vetProfile } = await supabase.from("profiles").select("full_name").eq("user_id", a.vet_id).maybeSingle();
            let petName = null;
            if (a.pet_id) {
              const { data: pet } = await supabase.from("pets").select("name").eq("id", a.pet_id).maybeSingle();
              petName = pet?.name;
            }
            return { ...a, vet_name: vetProfile?.full_name, pet_name: petName };
          })
        );
        setAppointments(enriched);
      }

      const { data: userPets } = await supabase.from("pets").select("id, name").eq("owner_id", user.id);
      if (userPets && userPets.length > 0) {
        const petIds = userPets.map(p => p.id);
        const { data: records } = await supabase
          .from("medical_records")
          .select("*")
          .in("pet_id", petIds)
          .order("record_date", { ascending: false });

        if (records) {
          const enrichedRecords = await Promise.all(
            records.map(async (r: any) => {
              const pet = userPets.find(p => p.id === r.pet_id);
              const { data: vetProfile } = await supabase.from("profiles").select("full_name").eq("user_id", r.vet_id).maybeSingle();
              return { ...r, pet_name: pet?.name, vet_name: vetProfile?.full_name };
            })
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
          <TabsTrigger value="adoptions" className="gap-2"><Heart className="h-4 w-4" />My Adoptions</TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2"><Calendar className="h-4 w-4" />Appointments</TabsTrigger>
          <TabsTrigger value="records" className="gap-2"><ClipboardList className="h-4 w-4" />Medical Records</TabsTrigger>
        </TabsList>

        <TabsContent value="adoptions" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">My Adoption Requests</h2>
          {loading ? <p className="text-muted-foreground">Loading...</p> : adoptionRequests.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No adoption requests yet. Browse pets to get started!</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {adoptionRequests.map((req) => (
                <Card key={req.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{req.pets?.name || "Pet"}</CardTitle>
                      <Badge className={
                        req.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        req.status === "approved" ? "bg-green-100 text-green-800" :
                        "bg-red-100 text-red-800"
                      }>{req.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {req.approved_visit_time && (
                      <p className="text-sm text-green-700">✅ Visit confirmed: {req.visit_date} at {req.approved_visit_time}</p>
                    )}
                    {req.preferred_visit_times && req.preferred_visit_times.length > 0 && !req.approved_visit_time && (
                      <p className="text-sm text-muted-foreground">Waiting for visit time approval...</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="appointments" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">My Vet Appointments</h2>
          {loading ? <p className="text-muted-foreground">Loading...</p> : appointments.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No appointments yet.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <Card key={appt.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{appt.appointment_date} at {appt.appointment_time}</CardTitle>
                        <CardDescription>
                          Vet: {appt.vet_name || "Unknown"} {appt.pet_name ? `• Pet: ${appt.pet_name}` : ""}
                        </CardDescription>
                      </div>
                      <Badge className={
                        appt.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        appt.status === "approved" ? "bg-blue-100 text-blue-800" :
                        appt.status === "completed" ? "bg-green-100 text-green-800" :
                        "bg-red-100 text-red-800"
                      }>{appt.status}</Badge>
                    </div>
                  </CardHeader>
                  {appt.medical_notes && (
                    <CardContent>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">Medical Notes:</p>
                        <p className="text-sm text-muted-foreground">{appt.medical_notes}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="records" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Medical Records</h2>
          {loading ? <p className="text-muted-foreground">Loading...</p> : medicalRecords.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No medical records yet.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {medicalRecords.map((record) => (
                <Card key={record.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{record.pet_name || "Pet"} - {record.record_date}</CardTitle>
                    <CardDescription>Vet: {record.vet_name || "Unknown"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Diagnosis:</span> {record.diagnosis}</p>
                    <p className="text-sm"><span className="font-medium">Treatment:</span> {record.treatment}</p>
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
