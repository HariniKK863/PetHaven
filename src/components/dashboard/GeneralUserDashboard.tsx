import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, Search, AlertTriangle, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface AdoptionRequest {
  id: string;
  message: string | null;
  status: string;
  created_at: string;
  pets: { name: string; species: string } | null;
}

interface LostFoundReport {
  id: string;
  type: string;
  pet_name: string | null;
  species: string;
  status: string;
  location: string;
  created_at: string;
}

interface InjuredReport {
  id: string;
  species: string;
  location: string;
  status: string;
  severity: string;
  created_at: string;
}

export function GeneralUserDashboard() {
  const { user } = useAuth();
  const [adoptionRequests, setAdoptionRequests] = useState<AdoptionRequest[]>([]);
  const [lostFoundReports, setLostFoundReports] = useState<LostFoundReport[]>([]);
  const [injuredReports, setInjuredReports] = useState<InjuredReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);

      // Fetch adoption requests
      const { data: adoptionData } = await supabase
        .from("adoption_requests")
        .select("id, message, status, created_at, pets(name, species)")
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false });

      setAdoptionRequests(adoptionData || []);

      // Fetch lost/found reports
      const { data: lostFoundData } = await supabase
        .from("lost_found_reports")
        .select("id, type, pet_name, species, status, location, created_at")
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false });

      setLostFoundReports(lostFoundData || []);

      // Fetch injured reports
      const { data: injuredData } = await supabase
        .from("injured_reports")
        .select("id, species, location, status, severity, created_at")
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false });

      setInjuredReports(injuredData || []);

      setLoading(false);
    };

    fetchData();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adoption Requests</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adoptionRequests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lost/Found Reports</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lostFoundReports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Injured Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{injuredReports.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Button asChild>
          <Link to="/adopt">
            <PawPrint className="mr-2 h-4 w-4" />
            Browse Pets for Adoption
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/lost-found">
            <Search className="mr-2 h-4 w-4" />
            Report Lost/Found Pet
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/report-injured">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Report Injured Animal
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="adoptions">
        <TabsList>
          <TabsTrigger value="adoptions">My Adoption Requests</TabsTrigger>
          <TabsTrigger value="lostfound">My Lost/Found Reports</TabsTrigger>
          <TabsTrigger value="injured">My Injured Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="adoptions" className="mt-6">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : adoptionRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No adoption requests yet.</p>
                <Button asChild>
                  <Link to="/adopt">Browse Pets</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {adoptionRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {request.pets?.name || "Unknown Pet"}
                        </CardTitle>
                        <CardDescription>
                          {request.pets?.species}
                        </CardDescription>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : request.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  </CardHeader>
                  {request.message && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        "{request.message}"
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="lostfound" className="mt-6">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : lostFoundReports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No lost/found reports.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {lostFoundReports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg capitalize">
                          {report.type}: {report.pet_name || report.species}
                        </CardTitle>
                        <CardDescription>{report.location}</CardDescription>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report.status === "active"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {report.status}
                      </span>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="injured" className="mt-6">
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
                        <CardTitle className="text-lg">{report.species}</CardTitle>
                        <CardDescription>{report.location}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.severity === "critical"
                            ? "bg-red-100 text-red-800"
                            : report.severity === "serious"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
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
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
