import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { PetOwnerDashboard } from "@/components/dashboard/PetOwnerDashboard";
import { ShelterDashboard } from "@/components/dashboard/ShelterDashboard";
import { VeterinarianDashboard } from "@/components/dashboard/VeterinarianDashboard";
import { GeneralUserDashboardV2 } from "@/components/dashboard/GeneralUserDashboardV2";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { VerificationUpload } from "@/components/dashboard/VerificationUpload";
import { Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("verification_status, verification_document_url")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setVerificationStatus(data.verification_status);
      setDocumentUrl(data.verification_document_url);
    }
    setProfileLoading(false);
  };

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && (role === "shelter" || role === "veterinarian")) {
      fetchProfile();
    } else {
      setProfileLoading(false);
    }
  }, [user, role]);

  if (loading || profileLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const needsVerification = (role === "shelter" || role === "veterinarian") && verificationStatus !== "approved";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-8">Welcome back! Here's your personalized dashboard.</p>

        {/* Show verification for unverified shelters/vets - BLOCK all features */}
        {needsVerification && (
          <div className="mb-8">
            <VerificationUpload
              currentStatus={verificationStatus}
              documentUrl={documentUrl}
              onUploadComplete={fetchProfile}
            />
            <Card className="mt-4 border-yellow-200 bg-yellow-50/50">
              <CardContent className="py-6 flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-yellow-600" />
                <p className="text-yellow-800">
                  Your account is pending admin verification. Features will be unlocked once your documents are approved.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Only show dashboard features if verified or not a shelter/vet */}
        {!needsVerification && (
          <>
            {role === "general_user" && <GeneralUserDashboardV2 />}
            {role === "pet_owner" && <PetOwnerDashboard />}
            {role === "shelter" && <ShelterDashboard />}
            {role === "veterinarian" && <VeterinarianDashboard />}
            {role === "admin" && <AdminDashboard />}
          </>
        )}

        {!role && !needsVerification && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No role assigned. Please contact support.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
