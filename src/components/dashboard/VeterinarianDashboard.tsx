import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Stethoscope, AlertTriangle, CheckCircle, Clock, PlusCircle, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
  id: string;
  user_id: string;
  pet_id: string | null;
  appointment_date: string;
  appointment_time: string;
  reason: string | null;
  status: string;
  medical_notes: string | null;
  created_at: string;
  user_name?: string;
  pet_name?: string;
}

interface InjuredReport {
  id: string;
  species: string;
  description: string;
  location: string;
  severity: string;
  status: string;
  created_at: string;
}

export function VeterinarianDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [injuredReports, setInjuredReports] = useState<InjuredReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Slot management
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");

  // Medical record dialog
  const [showMedicalDialog, setShowMedicalDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch appointments
    const { data: apptData } = await supabase
      .from("vet_appointments")
      .select("*")
      .eq("vet_id", user.id)
      .order("created_at", { ascending: false });

    if (apptData) {
      const enriched = await Promise.all(
        apptData.map(async (appt: any) => {
          const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", appt.user_id).maybeSingle();
          let petName = null;
          if (appt.pet_id) {
            const { data: pet } = await supabase.from("pets").select("name").eq("id", appt.pet_id).maybeSingle();
            petName = pet?.name;
          }
          return { ...appt, user_name: profile?.full_name, pet_name: petName };
        })
      );
      setAppointments(enriched);
    }

    // Fetch injured reports
    const { data: injuredData } = await supabase
      .from("injured_reports")
      .select("*")
      .order("created_at", { ascending: false });
    setInjuredReports(injuredData || []);

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleAddSlot = async () => {
    if (!user || !slotDate || !slotTime) return;
    const { error } = await supabase.from("vet_slots").insert({
      vet_id: user.id,
      slot_date: slotDate,
      slot_time: slotTime,
    });
    if (error) {
      toast({ title: "Error adding slot", variant: "destructive" });
    } else {
      toast({ title: "Slot added!" });
      setShowAddSlot(false);
      setSlotDate("");
      setSlotTime("");
    }
  };

  const handleApproveAppointment = async (appt: Appointment) => {
    await supabase.from("vet_appointments").update({ status: "approved" }).eq("id", appt.id);
    await supabase.from("notifications").insert({
      user_id: appt.user_id,
      title: "Appointment Confirmed! ✅",
      message: `Your appointment on ${appt.appointment_date} at ${appt.appointment_time} has been confirmed.`,
      type: "appointment_approved",
    });
    toast({ title: "Appointment approved!" });
    fetchData();
  };

  const handleRejectAppointment = async (appt: Appointment) => {
    await supabase.from("vet_appointments").update({ status: "rejected" }).eq("id", appt.id);
    // Free up the slot
    if (appt.pet_id) {
      // slot_id would need to be tracked, but we can find it
    }
    await supabase.from("notifications").insert({
      user_id: appt.user_id,
      title: "Appointment Declined",
      message: `Your appointment on ${appt.appointment_date} at ${appt.appointment_time} was declined.`,
      type: "appointment_rejected",
    });
    toast({ title: "Appointment rejected." });
    fetchData();
  };

  const openMedicalRecord = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setDiagnosis("");
    setTreatment("");
    setMedicalNotes("");
    setShowMedicalDialog(true);
  };

  const handleSubmitMedicalRecord = async () => {
    if (!user || !selectedAppointment || !diagnosis || !treatment) return;

    const { error } = await supabase.from("medical_records").insert({
      pet_id: selectedAppointment.pet_id!,
      vet_id: user.id,
      appointment_id: selectedAppointment.id,
      diagnosis,
      treatment,
      notes: medicalNotes || null,
    });

    if (error) {
      toast({ title: "Error creating record", variant: "destructive" });
      return;
    }

    // Close the case
    await supabase.from("vet_appointments").update({ status: "completed", medical_notes: `${diagnosis} - ${treatment}` }).eq("id", selectedAppointment.id);

    // Notify user
    await supabase.from("notifications").insert({
      user_id: selectedAppointment.user_id,
      title: "Medical Record Updated 📋",
      message: `Medical records for your appointment on ${selectedAppointment.appointment_date} have been updated. Diagnosis: ${diagnosis}`,
      type: "medical_record",
    });

    toast({ title: "Medical record saved & case closed!" });
    setShowMedicalDialog(false);
    fetchData();
  };

  const handleUpdateInjuredReport = async (reportId: string, status: string) => {
    await supabase.from("injured_reports").update({ status, assigned_vet_id: user?.id }).eq("id", reportId);
    toast({ title: `Report marked as ${status}!` });
    fetchData();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical": return "bg-red-100 text-red-800";
      case "serious": return "bg-orange-100 text-orange-800";
      case "moderate": return "bg-yellow-100 text-yellow-800";
      default: return "bg-green-100 text-green-800";
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="appointments">
        <TabsList>
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="h-4 w-4" />Appointments
          </TabsTrigger>
          <TabsTrigger value="slots" className="gap-2">
            <Clock className="h-4 w-4" />Manage Slots
          </TabsTrigger>
          <TabsTrigger value="injured" className="gap-2">
            <AlertTriangle className="h-4 w-4" />Injured Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Appointment Requests</h2>
          {loading ? <p className="text-muted-foreground">Loading...</p> : appointments.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No appointment requests.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <Card key={appt.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {appt.appointment_date} at {appt.appointment_time}
                        </CardTitle>
                        <CardDescription>
                          Patient: {appt.user_name || "Unknown"} {appt.pet_name ? `• Pet: ${appt.pet_name}` : ""}
                        </CardDescription>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        appt.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        appt.status === "approved" ? "bg-blue-100 text-blue-800" :
                        appt.status === "completed" ? "bg-green-100 text-green-800" :
                        "bg-red-100 text-red-800"
                      }`}>{appt.status}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {appt.reason && <p className="text-sm text-muted-foreground mb-4">{appt.reason}</p>}
                    {appt.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApproveAppointment(appt)}>
                          <CheckCircle className="mr-2 h-4 w-4" />Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectAppointment(appt)}>
                          Reject
                        </Button>
                      </div>
                    )}
                    {appt.status === "approved" && appt.pet_id && (
                      <Button size="sm" onClick={() => openMedicalRecord(appt)}>
                        <FileText className="mr-2 h-4 w-4" />Update Medical History & Close
                      </Button>
                    )}
                    {appt.status === "approved" && !appt.pet_id && (
                      <p className="text-sm text-muted-foreground">No pet linked - cannot add medical record.</p>
                    )}
                    {appt.status === "completed" && appt.medical_notes && (
                      <div className="p-3 bg-muted rounded-lg mt-2">
                        <p className="text-sm font-medium">Medical Notes:</p>
                        <p className="text-sm text-muted-foreground">{appt.medical_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="slots" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Available Slots</h2>
            <Button onClick={() => setShowAddSlot(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />Add Slot
            </Button>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Add your available time slots so users can book appointments with you.
          </p>
          <Dialog open={showAddSlot} onOpenChange={setShowAddSlot}>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Add Available Slot</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" value={slotTime} onChange={(e) => setSlotTime(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddSlot(false)}>Cancel</Button>
                <Button onClick={handleAddSlot}>Add Slot</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="injured" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Injured Animal Reports</h2>
          {loading ? <p className="text-muted-foreground">Loading...</p> : injuredReports.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No injured animal reports.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {injuredReports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />{report.species}
                        </CardTitle>
                        <CardDescription>Location: {report.location}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>{report.severity}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          report.status === "responding" ? "bg-blue-100 text-blue-800" :
                          "bg-green-100 text-green-800"
                        }`}>{report.status}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                    {report.status === "pending" && (
                      <Button size="sm" onClick={() => handleUpdateInjuredReport(report.id, "responding")}>
                        <Clock className="mr-2 h-4 w-4" />Respond
                      </Button>
                    )}
                    {report.status === "responding" && (
                      <Button size="sm" onClick={() => handleUpdateInjuredReport(report.id, "resolved")}>
                        <CheckCircle className="mr-2 h-4 w-4" />Mark Resolved
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Medical Record Dialog */}
      <Dialog open={showMedicalDialog} onOpenChange={setShowMedicalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Medical History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Diagnosis *</Label>
              <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Enter diagnosis" />
            </div>
            <div className="space-y-2">
              <Label>Treatment *</Label>
              <Input value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder="Enter treatment given" />
            </div>
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea value={medicalNotes} onChange={(e) => setMedicalNotes(e.target.value)} placeholder="Any additional notes..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMedicalDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitMedicalRecord} disabled={!diagnosis || !treatment}>
              Save & Close Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
