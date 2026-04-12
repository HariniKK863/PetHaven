import { useEffect, useState } from "react";
import { AlertTriangle, Calendar, CheckCircle, Clock, FileText, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ContactReporterDialog } from "@/components/ContactReporterDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatIndianPhone } from "@/lib/phone";
import { openPetMedicalFile, uploadPetMedicalFile } from "@/lib/pet-assets";

interface Appointment {
  id: string;
  user_id: string;
  pet_id: string | null;
  slot_id?: string | null;
  appointment_date: string;
  appointment_time: string;
  reason: string | null;
  status: string;
  medical_notes: string | null;
  created_at: string;
  user_name?: string;
  pet_name?: string | null;
  medical_card_file_path?: string | null;
  latest_medical_file_path?: string | null;
}

interface InjuredReport {
  id: string;
  species: string;
  description: string;
  location: string;
  reporter_email?: string | null;
  reporter_name?: string | null;
  reporter_phone?: string | null;
  severity: string;
  status: string;
  created_at: string;
}

interface VetSlot {
  id: string;
  slot_date: string;
  slot_time: string;
  is_booked: boolean;
}

export function VeterinarianDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [injuredReports, setInjuredReports] = useState<InjuredReport[]>([]);
  const [slots, setSlots] = useState<VetSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddSlot, setShowAddSlot] = useState(false);
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");

  const [showMedicalDialog, setShowMedicalDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [contactReport, setContactReport] = useState<InjuredReport | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [medicalFile, setMedicalFile] = useState<File | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: apptData, error: appointmentError } = await supabase
      .from("vet_appointments")
      .select("*")
      .eq("vet_id", user.id)
      .order("created_at", { ascending: false });

    if (appointmentError) {
      console.error("Error fetching appointments:", appointmentError);
    } else if (apptData) {
      const enriched = await Promise.all(
        apptData.map(async (appt) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", appt.user_id)
            .maybeSingle();

          let petName: string | null = null;
          let medicalCardFilePath: string | null = null;
          let latestMedicalFilePath: string | null = null;
          if (appt.pet_id) {
            const { data: pet } = await supabase
              .from("pets")
              .select("name, medical_card_file_path, latest_medical_file_path")
              .eq("id", appt.pet_id)
              .maybeSingle();
            petName = pet?.name ?? null;
            medicalCardFilePath = pet?.medical_card_file_path ?? null;
            latestMedicalFilePath = pet?.latest_medical_file_path ?? null;
          }

          return {
            ...appt,
            user_name: profile?.full_name ?? undefined,
            pet_name: petName,
            medical_card_file_path: medicalCardFilePath,
            latest_medical_file_path: latestMedicalFilePath,
          };
        })
      );
      setAppointments(enriched);
    }

    const { data: slotData, error: slotError } = await supabase
      .from("vet_slots")
      .select("id, slot_date, slot_time, is_booked")
      .eq("vet_id", user.id)
      .order("slot_date", { ascending: true })
      .order("slot_time", { ascending: true });

    if (slotError) {
      console.error("Error fetching slots:", slotError);
    } else {
      setSlots(slotData || []);
    }

    const { data: injuredData, error: injuredError } = await supabase
      .from("injured_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (injuredError) {
      console.error("Error fetching injured reports:", injuredError);
    } else {
      setInjuredReports(injuredData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAddSlot = async () => {
    if (!user || !slotDate || !slotTime) return;

    const { error } = await supabase.from("vet_slots").insert({
      vet_id: user.id,
      slot_date: slotDate,
      slot_time: slotTime,
    });

    if (error) {
      toast({ title: "Error adding slot", variant: "destructive" });
      return;
    }

    toast({ title: "Slot added!" });
    setShowAddSlot(false);
    setSlotDate("");
    setSlotTime("");
    fetchData();
  };

  const handleApproveAppointment = async (appt: Appointment) => {
    const { error } = await supabase
      .from("vet_appointments")
      .update({ status: "approved" })
      .eq("id", appt.id);

    if (error) {
      toast({ title: "Error approving appointment", variant: "destructive" });
      return;
    }

    const { error: notificationError } = await supabase.from("notifications").insert({
      user_id: appt.user_id,
      title: "Appointment Confirmed",
      message: `Your appointment on ${appt.appointment_date} at ${appt.appointment_time} has been confirmed.`,
      type: "appointment_approved",
      related_id: appt.id,
    });

    if (notificationError) {
      console.error("Error sending approval notification:", notificationError);
    }

    toast({ title: "Appointment approved!" });
    fetchData();
  };

  const handleRejectAppointment = async (appt: Appointment) => {
    const { error } = await supabase
      .from("vet_appointments")
      .update({ status: "rejected" })
      .eq("id", appt.id);

    if (error) {
      toast({ title: "Error rejecting appointment", variant: "destructive" });
      return;
    }

    const { error: notificationError } = await supabase.from("notifications").insert({
      user_id: appt.user_id,
      title: "Appointment Declined",
      message: `Your appointment on ${appt.appointment_date} at ${appt.appointment_time} was declined.`,
      type: "appointment_rejected",
      related_id: appt.id,
    });

    if (notificationError) {
      console.error("Error sending rejection notification:", notificationError);
    }

    toast({ title: "Appointment rejected." });
    fetchData();
  };

  const openMedicalRecord = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setDiagnosis("");
    setTreatment("");
    setMedicalNotes("");
    setMedicalFile(null);
    setShowMedicalDialog(true);
  };

  const handleViewMedicalFile = async (filePath: string) => {
    try {
      await openPetMedicalFile(filePath);
    } catch (error) {
      console.error("Error opening pet medical file:", error);
      toast({
        title: "Unable to open file",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitMedicalRecord = async () => {
    if (!user || !selectedAppointment || !diagnosis || !treatment) return;

    try {
      let medicalFilePath: string | null = null;

      if (selectedAppointment.pet_id && medicalFile) {
        try {
          medicalFilePath = await uploadPetMedicalFile(
            selectedAppointment.pet_id,
            "latest-medical",
            medicalFile,
          );
        } catch (uploadError) {
          console.error("Error uploading medical file:", uploadError);
          throw new Error(
            "Medical file upload failed. Make sure the medical-files bucket migration has been run in Supabase.",
          );
        }
      }

      const { error } = await supabase.rpc("complete_vet_appointment_record", {
        _appointment_id: selectedAppointment.id,
        _diagnosis: diagnosis,
        _treatment: treatment,
        _notes: medicalNotes || null,
        _medical_file_path: medicalFilePath,
      });

      if (error) {
        throw error;
      }

      const { error: notificationError } = await supabase.from("notifications").insert({
        user_id: selectedAppointment.user_id,
        title: "Medical Record Updated",
        message: `Medical records for your appointment on ${selectedAppointment.appointment_date} have been updated. Diagnosis: ${diagnosis}`,
        type: "medical_record",
        related_id: selectedAppointment.id,
      });

      if (notificationError) {
        console.error("Error sending medical record notification:", notificationError);
      }

      toast({ title: "Medical record saved and case closed!" });
      setShowMedicalDialog(false);
      setSelectedAppointment(null);
      fetchData();
    } catch (error) {
      console.error("Error creating record:", error);
      const description =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Please try again.";

      toast({
        title: "Error creating record",
        description,
        variant: "destructive",
      });
    }
  };

  const handleUpdateInjuredReport = async (reportId: string, status: string) => {
    const { error } = await supabase
      .from("injured_reports")
      .update({ status, assigned_vet_id: user?.id })
      .eq("id", reportId);

    if (error) {
      toast({ title: "Error updating report", variant: "destructive" });
      return;
    }

    toast({ title: `Report marked as ${status}!` });
    fetchData();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "serious":
        return "bg-orange-100 text-orange-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="appointments">
        <TabsList>
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="slots" className="gap-2">
            <Clock className="h-4 w-4" />
            Manage Slots
          </TabsTrigger>
          <TabsTrigger value="injured" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Injured Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="mt-6">
          <h2 className="mb-4 text-xl font-semibold">Appointment Requests</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : appointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No appointment requests.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <Card key={appt.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {appt.appointment_date} at {appt.appointment_time}
                        </CardTitle>
                        <CardDescription>
                          Patient: {appt.user_name || "Unknown"}
                          {appt.pet_name ? ` - Pet: ${appt.pet_name}` : ""}
                        </CardDescription>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          appt.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : appt.status === "approved"
                              ? "bg-blue-100 text-blue-800"
                              : appt.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {appt.reason && <p className="mb-4 text-sm text-muted-foreground">{appt.reason}</p>}
                    {(appt.medical_card_file_path || appt.latest_medical_file_path) && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {appt.medical_card_file_path && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewMedicalFile(appt.medical_card_file_path!)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Medical Card
                          </Button>
                        )}
                        {appt.latest_medical_file_path && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewMedicalFile(appt.latest_medical_file_path!)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Latest Report
                          </Button>
                        )}
                      </div>
                    )}
                    {appt.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApproveAppointment(appt)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectAppointment(appt)}>
                          Reject
                        </Button>
                      </div>
                    )}
                    {appt.status === "approved" && appt.pet_id && (
                      <Button size="sm" onClick={() => openMedicalRecord(appt)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Update Medical History and Close
                      </Button>
                    )}
                    {appt.status === "approved" && !appt.pet_id && (
                      <p className="text-sm text-muted-foreground">No pet linked - cannot add medical record.</p>
                    )}
                    {appt.status === "completed" && appt.medical_notes && (
                      <div className="mt-2 rounded-lg bg-muted p-3">
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Available Slots</h2>
            <Button onClick={() => setShowAddSlot(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Slot
            </Button>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Add your available time slots so users can book appointments with you.
          </p>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : slots.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No slots added yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="mb-4 space-y-3">
              {slots.map((slot) => (
                <Card key={slot.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{slot.slot_date} at {slot.slot_time}</p>
                      <p className="text-sm text-muted-foreground">
                        {slot.is_booked ? "Booked" : "Available for booking"}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      slot.is_booked ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                    }`}>
                      {slot.is_booked ? "Booked" : "Open"}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <Dialog open={showAddSlot} onOpenChange={setShowAddSlot}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Add Available Slot</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" value={slotTime} onChange={(e) => setSlotTime(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddSlot(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSlot}>Add Slot</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="injured" className="mt-6">
          <h2 className="mb-4 text-xl font-semibold">Injured Animal Reports</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : injuredReports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No injured animal reports.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {injuredReports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          {report.species}
                        </CardTitle>
                        <CardDescription>Location: {report.location}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getSeverityColor(report.severity)}`}
                        >
                          {report.severity}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            report.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : report.status === "responding"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground">{report.description}</p>
                    {(report.reporter_name || report.reporter_phone) && (
                      <div className="mb-4 space-y-1 text-sm text-muted-foreground">
                        {report.reporter_name && <p>Reporter: {report.reporter_name}</p>}
                        {report.reporter_phone && <p>Phone: {formatIndianPhone(report.reporter_phone)}</p>}
                      </div>
                    )}
                    <div className="flex gap-2">
                    {report.status === "pending" && (
                      <Button size="sm" onClick={() => handleUpdateInjuredReport(report.id, "responding")}>
                        <Clock className="mr-2 h-4 w-4" />
                        Respond
                      </Button>
                    )}
                    {report.status === "responding" && (
                      <Button size="sm" onClick={() => handleUpdateInjuredReport(report.id, "resolved")}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark Resolved
                      </Button>
                    )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setContactReport(report)}
                      >
                        Contact Reporter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
            <div className="space-y-2">
              <Label>Updated Medical File</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setMedicalFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMedicalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitMedicalRecord} disabled={!diagnosis || !treatment}>
              Save and Close Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ContactReporterDialog
        open={!!contactReport}
        onOpenChange={(open) => {
          if (!open) {
            setContactReport(null);
          }
        }}
        reporterName={contactReport?.reporter_name || undefined}
        reporterEmail={contactReport?.reporter_email || undefined}
        reporterPhone={contactReport?.reporter_phone || undefined}
      />
    </div>
  );
}
