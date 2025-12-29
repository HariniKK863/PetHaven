import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, FileText, Users, Building2, Stethoscope } from "lucide-react";

interface VerificationRequest {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  organization_name: string | null;
  verification_document_url: string | null;
  verification_status: string | null;
  role: string;
}

export function AdminDashboard() {
  const { toast } = useToast();
  const [pendingVerifications, setPendingVerifications] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingVerifications = async () => {
    setLoading(true);

    // Fetch profiles that need verification (shelters and vets with pending status)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, email, organization_name, verification_document_url, verification_status")
      .eq("verification_status", "pending");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      setLoading(false);
      return;
    }

    // Get roles for these users
    const userIds = (profiles || []).map(p => p.user_id);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds)
      .in("role", ["shelter", "veterinarian"]);

    // Combine profiles with roles
    const combined = (profiles || [])
      .map(profile => {
        const userRole = (roles || []).find(r => r.user_id === profile.user_id);
        if (userRole) {
          return { ...profile, role: userRole.role };
        }
        return null;
      })
      .filter(Boolean) as VerificationRequest[];

    setPendingVerifications(combined);
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const handleVerification = async (userId: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("profiles")
      .update({ 
        verification_status: status,
        is_verified: status === "approved"
      })
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update verification status.",
        variant: "destructive",
      });
    } else {
      toast({
        title: status === "approved" ? "Approved!" : "Rejected",
        description: `Verification request has been ${status}.`,
      });
      fetchPendingVerifications();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "shelter":
        return <Building2 className="h-5 w-5 text-primary" />;
      case "veterinarian":
        return <Stethoscope className="h-5 w-5 text-primary" />;
      default:
        return <Users className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingVerifications.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="verifications">
        <TabsList>
          <TabsTrigger value="verifications" className="gap-2">
            <FileText className="h-4 w-4" />
            Verification Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="verifications" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Pending Verification Requests</h2>

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : pendingVerifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending verification requests.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingVerifications.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {getRoleIcon(request.role)}
                        <div>
                          <CardTitle className="text-lg">
                            {request.organization_name || request.full_name || "Unknown"}
                          </CardTitle>
                          <CardDescription>
                            {request.email} • {request.role === "shelter" ? "Animal Shelter" : "Veterinarian"}
                          </CardDescription>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {request.verification_document_url ? (
                      <div className="mb-4">
                        <a
                          href={request.verification_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          View Verification Document
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-4">
                        No verification document uploaded yet.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleVerification(request.user_id, "approved")}
                        disabled={!request.verification_document_url}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerification(request.user_id, "rejected")}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
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
