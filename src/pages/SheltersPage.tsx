import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, MapPin, Phone, Mail, ExternalLink, CheckCircle } from "lucide-react";

const shelters = [
  {
    id: "1",
    name: "Downtown Animal Shelter",
    description:
      "A nonprofit animal shelter dedicated to rescuing and rehoming abandoned pets. We provide medical care, training, and love to all our animals.",
    address: "123 Main Street, Downtown",
    phone: "+1 (555) 123-4567",
    email: "info@downtownshelter.org",
    website: "www.downtownshelter.org",
    verified: true,
    petsAvailable: 45,
    services: ["Adoption", "Foster Care", "Medical Care", "Training"],
    image:
      "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=300&fit=crop",
  },
  {
    id: "2",
    name: "Paws Rescue Center",
    description:
      "Specializing in rescuing and rehabilitating cats. Our mission is to find loving homes for every feline in our care.",
    address: "456 Oak Avenue, Eastside",
    phone: "+1 (555) 234-5678",
    email: "adopt@pawsrescue.org",
    website: "www.pawsrescue.org",
    verified: true,
    petsAvailable: 28,
    services: ["Cat Adoption", "TNR Program", "Medical Care"],
    image:
      "https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=600&h=300&fit=crop",
  },
  {
    id: "3",
    name: "Happy Tails Sanctuary",
    description:
      "A no-kill sanctuary providing lifetime care for senior and special needs animals who may not find adoptive homes.",
    address: "789 Country Road, Suburbs",
    phone: "+1 (555) 345-6789",
    email: "contact@happytails.org",
    website: "www.happytails.org",
    verified: true,
    petsAvailable: 62,
    services: ["Senior Pet Care", "Special Needs", "Sanctuary", "Adoption"],
    image:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=300&fit=crop",
  },
  {
    id: "4",
    name: "Kitty Haven",
    description:
      "Dedicated cat shelter focused on rescue, rehabilitation, and rehoming of cats of all ages and backgrounds.",
    address: "321 Whisker Lane, Midtown",
    phone: "+1 (555) 456-7890",
    email: "hello@kittyhaven.org",
    website: "www.kittyhaven.org",
    verified: false,
    petsAvailable: 34,
    services: ["Cat Adoption", "Kitten Foster", "Medical Care"],
    image:
      "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=600&h=300&fit=crop",
  },
];

export default function SheltersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredShelters = shelters.filter((shelter) => {
    return (
      shelter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shelter.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary rounded-full p-2">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Animal Shelters
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Connect with verified animal shelters in your area. All shelters are
            reviewed by our admin team to ensure ethical practices and quality
            care.
          </p>
        </div>
      </section>

      {/* Search */}
      <section className="py-6 border-b border-border sticky top-16 bg-background/95 backdrop-blur-sm z-40">
        <div className="container mx-auto px-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shelters by name or location..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Shelters Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <p className="text-sm text-muted-foreground mb-6">
            Showing {filteredShelters.length} shelters
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredShelters.map((shelter) => (
              <Card key={shelter.id} className="overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={shelter.image}
                    alt={shelter.name}
                    className="w-full h-full object-cover"
                  />
                  {shelter.verified && (
                    <Badge className="absolute top-3 left-3 bg-green-600 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">
                        {shelter.name}
                      </h3>
                      <p className="text-sm text-primary font-medium">
                        {shelter.petsAvailable} pets available
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {shelter.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {shelter.services.map((service) => (
                      <Badge key={service} variant="secondary" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{shelter.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>{shelter.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>{shelter.email}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex gap-3">
                  <Button className="flex-1">View Pets</Button>
                  <Button variant="outline" asChild>
                    <a
                      href={`https://${shelter.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Register CTA */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Are You a Shelter?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            Register your animal shelter with PetHaven to reach more potential
            adopters. Our admin team will verify your organization to build
            trust with the community.
          </p>
          <Button size="lg">Register Your Shelter</Button>
        </div>
      </section>
    </Layout>
  );
}
