import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { LostFoundCard } from "@/components/LostFoundCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { normalizeIndianPhoneInput } from "@/lib/phone";

interface Report {
  id: string;
  type: "lost" | "found";
  pet_name: string | null;
  species: string;
  breed: string | null;
  color: string | null;
  location: string;
  date_reported: string;
  description: string | null;
  image_url: string | null;
  contact_info: string | null;
  reporter_id: string;
  reporter_name?: string;
  reporter_email?: string;
  reporter_phone?: string;
}

export default function LostFoundPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formType, setFormType] = useState("lost");
  const [formSpecies, setFormSpecies] = useState("dog");
  const [formPetName, setFormPetName] = useState("");
  const [formBreed, setFormBreed] = useState("");
  const [formColor, setFormColor] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formContact, setFormContact] = useState("");

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("lost_found_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && !error) {
      // Fetch reporter profiles
      const reporterIds = [...new Set(data.map(r => r.reporter_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .in("user_id", reporterIds);

      const reportsWithProfiles = data.map(r => {
        const profile = (profiles || []).find(p => p.user_id === r.reporter_id);
        return {
          ...r,
          type: r.type as "lost" | "found",
          reporter_name: profile?.full_name || undefined,
          reporter_email: profile?.email || undefined,
          reporter_phone: profile?.phone || r.contact_info || undefined,
        };
      });
      setReports(reportsWithProfiles);
    }
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      (report.pet_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (report.breed || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || report.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSubmitReport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Please log in", description: "You need to be logged in to submit a report.", variant: "destructive" });
      navigate("/login");
      return;
    }

    const { error } = await supabase.from("lost_found_reports").insert({
      type: formType,
      species: formSpecies,
      pet_name: formPetName || null,
      breed: formBreed || null,
      color: formColor || null,
      location: formLocation,
      description: formDescription || null,
      contact_info: formContact || null,
      reporter_id: user.id,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to submit report.", variant: "destructive" });
    } else {
      toast({ title: "Report Submitted", description: "Your report has been submitted successfully." });
      setIsDialogOpen(false);
      fetchReports();
    }
  };

  return (
    <Layout>
      <section className="bg-gradient-to-b from-primary/10 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary rounded-full p-2">
                  <AlertTriangle className="h-6 w-6 text-primary-foreground" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">Lost & Found Pets</h1>
              </div>
              <p className="text-muted-foreground max-w-2xl">
                Help reunite pets with their families. Report a lost pet or let us know if you've found one.
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              if (open && !user) {
                toast({ title: "Please log in", variant: "destructive" });
                navigate("/login");
                return;
              }
              setIsDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button size="lg"><Plus className="mr-2 h-5 w-5" />Report Pet</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Report a Lost or Found Pet</DialogTitle>
                  <DialogDescription>Fill in the details to help locate the pet or find its owner.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitReport} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Report Type</Label>
                      <Select value={formType} onValueChange={setFormType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lost">Lost Pet</SelectItem>
                          <SelectItem value="found">Found Pet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Species</Label>
                      <Select value={formSpecies} onValueChange={setFormSpecies}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dog">Dog</SelectItem>
                          <SelectItem value="cat">Cat</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Pet Name (if known)</Label>
                    <Input value={formPetName} onChange={(e) => setFormPetName(e.target.value)} placeholder="Enter pet name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Breed</Label>
                      <Input value={formBreed} onChange={(e) => setFormBreed(e.target.value)} placeholder="e.g., Labrador" />
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Input value={formColor} onChange={(e) => setFormColor(e.target.value)} placeholder="e.g., Brown" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Location *</Label>
                    <Input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="Enter location" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Provide details..." rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input value={formContact} onChange={(e) => setFormContact(normalizeIndianPhoneInput(e.target.value))} type="tel" placeholder="98765 43210" />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">Submit Report</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <section className="py-6 border-b border-border sticky top-16 bg-background/95 backdrop-blur-sm z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, breed, or location..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="found">Found</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <p className="text-center text-muted-foreground">Loading reports...</p>
          ) : filteredReports.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-6">Showing {filteredReports.length} reports</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReports.map((report) => (
                  <LostFoundCard
                    key={report.id}
                    id={report.id}
                    type={report.type}
                    petName={report.pet_name || undefined}
                    species={report.species}
                    breed={report.breed || "Unknown"}
                    color={report.color || "Unknown"}
                    location={report.location}
                    date={new Date(report.date_reported).toLocaleDateString()}
                    description={report.description || "No description"}
                    image={report.image_url || "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=500&h=300&fit=crop"}
                    contactPhone={report.contact_info || undefined}
                    reporterName={report.reporter_name}
                    reporterEmail={report.reporter_email}
                    reporterPhone={report.reporter_phone}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No reports found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
              <Button variant="outline" onClick={() => { setSearchQuery(""); setTypeFilter("all"); }}>Clear Filters</Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
