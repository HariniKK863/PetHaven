import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Stethoscope, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TreatmentRequest {
  id: string;
  description: string;
  status: string;
  notes: string | null;
  created_at: string;
  pets: { name: string } | null;
  profiles: { full_name: string | null; email: string | null } | null;
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
  const [treatmentRequests, setTreatmentRequests] = useState<TreatmentRequest[]>([]);
  const [injuredReports, setInjuredReports] = useState<InjuredReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);

    // Fetch all treatment requests (vets can see all)
    const { data: treatmentsData, error: treatmentsError } = await supabase
      .from("treatment_requests")
      .select("id, description, status, notes, created_at, owner_id, pets(name)")
      .order("created_at", { ascending: false });

    if (treatmentsError) {
      console.error("Error fetching treatments:", treatmentsError);
    } else {
      // Fetch owner profiles
      const treatmentsWithProfiles = await Promise.all(
        (treatmentsData || []).map(async (req: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("user_id", req.owner_id)
            .maybeSingle();
          
          return {
            ...req,
            profiles: profile
          };
        })
      );
      setTreatmentRequests(treatmentsWithProfiles);
    }

    // Fetch all injured reports (vets can see all)
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

  const handleUpdateTreatment = async (requestId: string, status: string) => {
    const { error } = await supabase
      .from("treatment_requests")
      .update({ status, veterinarian_id: user?.id })
      .eq("id", requestId);

    if (error) {
      toast({ title: "Error updating treatment", variant: "destructive" });
    } else {
      toast({ title: `Treatment marked as ${status}!` });
      fetchData();
    }
  };

  const handleUpdateInjuredReport = async (reportId: string, status: string) => {
    const { error } = await supabase
      .from("injured_reports")
      .update({ status, assigned_vet_id: user?.id })
      .eq("id", reportId);

    if (error) {
      toast({ title: "Error updating report", variant: "destructive" });
    } else {
      toast({ title: `Report marked as ${status}!` });
      fetchData();
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="treatments">
        <TabsList>
          <TabsTrigger value="treatments" className="gap-2">
            <Stethoscope className="h-4 w-4" />
            Treatment Requests
          </TabsTrigger>
          <TabsTrigger value="injured" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Injured Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="treatments" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Treatment Requests</h2>

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : treatmentRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No treatment requests.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {treatmentRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {request.pets?.name || "Unknown Pet"}
                        </CardTitle>
                        <CardDescription>
                          Owner: {request.profiles?.full_name || request.profiles?.email || "Unknown"}
                        </CardDescription>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : request.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {request.description}
                    </p>
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateTreatment(request.id, "in_progress")}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Accept
                        </Button>
                      </div>
                    )}
                    {request.status === "in_progress" && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateTreatment(request.id, "completed")}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark Complete
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="injured" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Injured Animal Reports</h2>

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : injuredReports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No injured animal reports.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {injuredReports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          {report.species}
                        </CardTitle>
                        <CardDescription>
                          Location: {report.location}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                          {report.severity}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : report.status === "responding"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          {report.status}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {report.description}
                    </p>
                    {report.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateInjuredReport(report.id, "responding")}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Respond
                      </Button>
                    )}
                    {report.status === "responding" && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateInjuredReport(report.id, "resolved")}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark Resolved
                      </Button>
                    )}
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
