import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { PetOwnerDashboard } from "@/components/dashboard/PetOwnerDashboard";
import { ShelterDashboard } from "@/components/dashboard/ShelterDashboard";
import { VeterinarianDashboard } from "@/components/dashboard/VeterinarianDashboard";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-8">
          Welcome back! Here's your personalized dashboard.
        </p>

        {role === "pet_owner" && <PetOwnerDashboard />}
        {role === "shelter" && <ShelterDashboard />}
        {role === "veterinarian" && <VeterinarianDashboard />}
        {!role && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No role assigned. Please contact support.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
