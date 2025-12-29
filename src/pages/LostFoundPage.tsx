import { useState } from "react";
import { Layout } from "@/components/Layout";
import { LostFoundCard } from "@/components/LostFoundCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const reports = [
  {
    id: "1",
    type: "lost" as const,
    petName: "Max",
    species: "Dog",
    breed: "Golden Retriever",
    color: "Golden",
    location: "Central Park, Downtown",
    date: "Dec 25, 2024",
    description:
      "Lost golden retriever wearing a blue collar with name tag. Very friendly, answers to Max.",
    image:
      "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=500&h=300&fit=crop",
    contactPhone: "+1 (555) 123-4567",
  },
  {
    id: "2",
    type: "found" as const,
    species: "Cat",
    breed: "Tabby",
    color: "Orange and White",
    location: "Oak Street, near library",
    date: "Dec 27, 2024",
    description:
      "Found an orange tabby cat near the library. No collar, seems well-fed and friendly.",
    image:
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500&h=300&fit=crop",
    contactPhone: "+1 (555) 234-5678",
  },
  {
    id: "3",
    type: "lost" as const,
    petName: "Bella",
    species: "Dog",
    breed: "Husky",
    color: "Black and White",
    location: "Riverside Park",
    date: "Dec 26, 2024",
    description:
      "Lost husky with blue eyes. Has a microchip. Last seen near the river trail.",
    image:
      "https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=500&h=300&fit=crop",
    contactPhone: "+1 (555) 345-6789",
  },
  {
    id: "4",
    type: "found" as const,
    species: "Dog",
    breed: "Beagle",
    color: "Tricolor",
    location: "Main Street Market",
    date: "Dec 28, 2024",
    description:
      "Found a beagle wandering near the market. Has a red collar but no tags. Currently at my home.",
    image:
      "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=500&h=300&fit=crop",
    contactPhone: "+1 (555) 456-7890",
  },
];

export default function LostFoundPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      (report.petName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false) ||
      report.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || report.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSubmitReport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: "Report Submitted",
      description:
        "Your report has been submitted successfully. We'll notify you of any matches.",
    });
    setIsDialogOpen(false);
  };

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary rounded-full p-2">
                  <AlertTriangle className="h-6 w-6 text-primary-foreground" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Lost & Found Pets
                </h1>
              </div>
              <p className="text-muted-foreground max-w-2xl">
                Help reunite pets with their families. Report a lost pet or let
                us know if you've found one.
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Report Pet
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Report a Lost or Found Pet</DialogTitle>
                  <DialogDescription>
                    Fill in the details to help locate the pet or find its
                    owner.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitReport} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-type">Report Type</Label>
                      <Select defaultValue="lost">
                        <SelectTrigger id="report-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lost">Lost Pet</SelectItem>
                          <SelectItem value="found">Found Pet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="species">Species</Label>
                      <Select defaultValue="dog">
                        <SelectTrigger id="species">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dog">Dog</SelectItem>
                          <SelectItem value="cat">Cat</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pet-name">Pet Name (if known)</Label>
                    <Input id="pet-name" placeholder="Enter pet name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="breed">Breed</Label>
                      <Input id="breed" placeholder="e.g., Labrador" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="color">Color</Label>
                      <Input id="color" placeholder="e.g., Brown and White" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Last Seen Location</Label>
                    <Input id="location" placeholder="Enter location" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide any additional details..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact Phone</Label>
                    <Input id="contact" type="tel" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Submit Report</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b border-border sticky top-16 bg-background/95 backdrop-blur-sm z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, breed, or location..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="found">Found</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Reports Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {filteredReports.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Showing {filteredReports.length} reports
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReports.map((report) => (
                  <LostFoundCard key={report.id} {...report} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No reports found
              </h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
