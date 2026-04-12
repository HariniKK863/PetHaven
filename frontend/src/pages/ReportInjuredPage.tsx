import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, MapPin, Phone, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ContactReporterDialog } from "@/components/ContactReporterDialog";
import { formatIndianPhone, normalizeIndianPhoneInput } from "@/lib/phone";

interface InjuredReport {
  id: string;
  species: string;
  description: string;
  location: string;
  severity: string;
  status: string;
  reporter_id: string;
  reporter_email?: string | null;
  reporter_name?: string | null;
  reporter_phone?: string | null;
  created_at: string;
}

export default function ReportInjuredPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [species, setSpecies] = useState("");
  const [severity, setSeverity] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");

  // Reports list
  const [reports, setReports] = useState<InjuredReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [contactReport, setContactReport] = useState<InjuredReport | null>(null);

  const fetchReports = async () => {
    const { data } = await supabase
      .from("injured_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setReports(data);
    }
    setLoadingReports(false);
  };

  useEffect(() => { fetchReports(); }, []);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("profiles")
      .select("phone")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.phone) {
          setReporterPhone(normalizeIndianPhoneInput(data.phone));
        }
      });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Please log in", variant: "destructive" });
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", user.id)
      .maybeSingle();

    const { error } = await supabase.from("injured_reports").insert({
      species,
      severity,
      location,
      description,
      reporter_id: user.id,
      reporter_name: profile?.full_name || user.user_metadata?.full_name || null,
      reporter_email: profile?.email || user.email || null,
      reporter_phone: reporterPhone || null,
    });

    setIsSubmitting(false);
    if (error) {
      toast({ title: "Error", description: "Failed to submit report.", variant: "destructive" });
    } else {
      setIsSubmitted(true);
      toast({ title: "Report Submitted Successfully" });
      fetchReports();
    }
  };

  if (isSubmitted) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4">
            <Card className="max-w-lg mx-auto text-center">
              <CardContent className="pt-12 pb-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Report Submitted Successfully</h2>
                <p className="text-muted-foreground mb-6">
                  Thank you for reporting this injured animal. Our team has been notified.
                </p>
                <div className="space-y-3">
                  <Button onClick={() => setIsSubmitted(false)} className="w-full">Submit Another Report</Button>
                  <Button variant="outline" asChild className="w-full"><a href="/">Return Home</a></Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-gradient-to-b from-destructive/10 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-destructive rounded-full p-2">
              <AlertCircle className="h-6 w-6 text-destructive-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Report Injured Animal</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            If you've found an injured animal, please fill out this form. Our team will dispatch help.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader><CardTitle>Emergency Report Form</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Animal Type</Label>
                        <Select value={species} onValueChange={setSpecies} required>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dog">Dog</SelectItem>
                            <SelectItem value="cat">Cat</SelectItem>
                            <SelectItem value="bird">Bird</SelectItem>
                            <SelectItem value="wildlife">Wildlife</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Severity Level</Label>
                        <Select value={severity} onValueChange={setSeverity} required>
                          <SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="serious">Serious</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="minor">Minor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Enter the exact location" className="pl-10" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description of Injuries</Label>
                      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the animal's condition..." rows={4} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={formatIndianPhone(reporterPhone)}
                          onChange={(e) => setReporterPhone(normalizeIndianPhoneInput(e.target.value))}
                          placeholder="+91 98765 43210"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit Emergency Report"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Recent Reports */}
              {!loadingReports && reports.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">Recent Reports</h2>
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <Card key={report.id}>
                        <CardContent className="py-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{report.species} - {report.severity}</p>
                              <p className="text-sm text-muted-foreground">{report.location}</p>
                              <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                              {report.reporter_phone && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Reporter Phone: {formatIndianPhone(report.reporter_phone)}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                report.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                report.status === "responding" ? "bg-blue-100 text-blue-800" :
                                "bg-green-100 text-green-800"
                              }`}>{report.status}</span>
                              <Button size="sm" variant="outline" onClick={() => {
                                if (!user) {
                                  toast({ title: "Please log in", variant: "destructive" });
                                  navigate("/login");
                                  return;
                                }
                                setContactReport(report);
                              }}>
                                Contact Reporter
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-destructive" />Emergency Hotline
                  </h3>
                  <p className="text-2xl font-bold text-destructive mb-2">+91 98765 43210</p>
                  <p className="text-sm text-muted-foreground">For critical emergencies, call immediately</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />Response Times
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2"><span className="font-medium text-destructive">Critical:</span><span className="text-muted-foreground">15-30 minutes</span></li>
                    <li className="flex items-start gap-2"><span className="font-medium text-orange-600">Serious:</span><span className="text-muted-foreground">30-60 minutes</span></li>
                    <li className="flex items-start gap-2"><span className="font-medium text-yellow-600">Moderate:</span><span className="text-muted-foreground">1-2 hours</span></li>
                    <li className="flex items-start gap-2"><span className="font-medium text-green-600">Minor:</span><span className="text-muted-foreground">Same day</span></li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <ContactReporterDialog
        open={!!contactReport}
        onOpenChange={(open) => { if (!open) setContactReport(null); }}
        reporterName={contactReport?.reporter_name || undefined}
        reporterEmail={contactReport?.reporter_email || undefined}
        reporterPhone={contactReport?.reporter_phone || undefined}
      />
    </Layout>
  );
}
