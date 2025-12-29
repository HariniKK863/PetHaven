import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Search,
  Stethoscope,
  MapPin,
  Clock,
  Star,
  Calendar,
  Phone,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const veterinarians = [
  {
    id: "1",
    name: "Dr. Sarah Mitchell",
    specialization: "General Practice",
    clinic: "PetCare Veterinary Clinic",
    location: "123 Main Street, Downtown",
    rating: 4.9,
    reviews: 128,
    availability: "Available Today",
    image:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face",
    services: ["Wellness Exams", "Vaccinations", "Surgery", "Dental Care"],
  },
  {
    id: "2",
    name: "Dr. James Wilson",
    specialization: "Surgery Specialist",
    clinic: "Animal Hospital Plus",
    location: "456 Oak Avenue",
    rating: 4.8,
    reviews: 95,
    availability: "Next Available: Tomorrow",
    image:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face",
    services: ["Orthopedic Surgery", "Soft Tissue Surgery", "Emergency Care"],
  },
  {
    id: "3",
    name: "Dr. Emily Chen",
    specialization: "Exotic Animals",
    clinic: "Exotic Pet Care Center",
    location: "789 Park Road",
    rating: 4.7,
    reviews: 67,
    availability: "Available Today",
    image:
      "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop&crop=face",
    services: ["Birds", "Reptiles", "Small Mammals", "Exotic Care"],
  },
  {
    id: "4",
    name: "Dr. Michael Brown",
    specialization: "Emergency Care",
    clinic: "24/7 Pet Emergency",
    location: "321 Urgent Lane",
    rating: 4.9,
    reviews: 203,
    availability: "24/7 Available",
    image:
      "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&h=200&fit=crop&crop=face",
    services: ["Emergency Surgery", "Critical Care", "Trauma", "Poison Control"],
  },
];

export default function VetServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVet, setSelectedVet] = useState<typeof veterinarians[0] | null>(null);
  const { toast } = useToast();

  const filteredVets = veterinarians.filter((vet) => {
    const matchesSearch =
      vet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vet.clinic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialization =
      specializationFilter === "all" ||
      vet.specialization.toLowerCase().includes(specializationFilter.toLowerCase());
    return matchesSearch && matchesSpecialization;
  });

  const handleBookAppointment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: "Appointment Requested",
      description: `Your appointment with ${selectedVet?.name} has been requested. You'll receive a confirmation soon.`,
    });
    setIsDialogOpen(false);
  };

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary rounded-full p-2">
              <Stethoscope className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Veterinary Services
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Find licensed veterinarians near you. Book appointments, manage pet
            medical records, and ensure the best care for your furry friends.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b border-border sticky top-16 bg-background/95 backdrop-blur-sm z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or clinic..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Specialization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specializations</SelectItem>
                <SelectItem value="general">General Practice</SelectItem>
                <SelectItem value="surgery">Surgery</SelectItem>
                <SelectItem value="emergency">Emergency Care</SelectItem>
                <SelectItem value="exotic">Exotic Animals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Vets Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <p className="text-sm text-muted-foreground mb-6">
            Showing {filteredVets.length} veterinarians
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredVets.map((vet) => (
              <Card key={vet.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex gap-4">
                    <img
                      src={vet.image}
                      alt={vet.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground">
                        {vet.name}
                      </h3>
                      <p className="text-sm text-primary font-medium">
                        {vet.specialization}
                      </p>
                      <p className="text-sm text-muted-foreground">{vet.clinic}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{vet.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({vet.reviews} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {vet.services.map((service) => (
                      <Badge key={service} variant="secondary" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{vet.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-green-600 font-medium">
                        {vet.availability}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Dialog open={isDialogOpen && selectedVet?.id === vet.id} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (open) setSelectedVet(vet);
                  }}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Calendar className="mr-2 h-4 w-4" />
                        Book Appointment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Book Appointment</DialogTitle>
                        <DialogDescription>
                          Schedule an appointment with {vet.name} at {vet.clinic}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleBookAppointment} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="pet-name">Pet Name</Label>
                          <Input id="pet-name" placeholder="Enter your pet's name" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="date">Preferred Date</Label>
                            <Input id="date" type="date" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="time">Preferred Time</Label>
                            <Select>
                              <SelectTrigger id="time">
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="9am">9:00 AM</SelectItem>
                                <SelectItem value="10am">10:00 AM</SelectItem>
                                <SelectItem value="11am">11:00 AM</SelectItem>
                                <SelectItem value="2pm">2:00 PM</SelectItem>
                                <SelectItem value="3pm">3:00 PM</SelectItem>
                                <SelectItem value="4pm">4:00 PM</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reason">Reason for Visit</Label>
                          <Textarea
                            id="reason"
                            placeholder="Describe the reason for your visit..."
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Contact Phone</Label>
                          <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" required />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">Request Appointment</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
