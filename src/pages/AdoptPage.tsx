import { useState } from "react";
import { Layout } from "@/components/Layout";
import { PetCard } from "@/components/PetCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, PawPrint } from "lucide-react";

const allPets = [
  {
    id: "1",
    name: "Buddy",
    species: "Dog",
    breed: "Golden Retriever",
    age: "2 years",
    gender: "Male",
    location: "Downtown Shelter",
    image:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&h=500&fit=crop",
    status: "available" as const,
  },
  {
    id: "2",
    name: "Luna",
    species: "Cat",
    breed: "Persian",
    age: "1 year",
    gender: "Female",
    location: "Paws Rescue",
    image:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&h=500&fit=crop",
    status: "available" as const,
  },
  {
    id: "3",
    name: "Max",
    species: "Dog",
    breed: "Labrador",
    age: "3 years",
    gender: "Male",
    location: "Happy Tails",
    image:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=500&h=500&fit=crop",
    status: "pending" as const,
  },
  {
    id: "4",
    name: "Whiskers",
    species: "Cat",
    breed: "British Shorthair",
    age: "8 months",
    gender: "Male",
    location: "Kitty Haven",
    image:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=500&h=500&fit=crop",
    status: "available" as const,
  },
  {
    id: "5",
    name: "Charlie",
    species: "Dog",
    breed: "Beagle",
    age: "4 years",
    gender: "Male",
    location: "Downtown Shelter",
    image:
      "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=500&h=500&fit=crop",
    status: "available" as const,
  },
  {
    id: "6",
    name: "Mittens",
    species: "Cat",
    breed: "Tabby",
    age: "2 years",
    gender: "Female",
    location: "Paws Rescue",
    image:
      "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=500&h=500&fit=crop",
    status: "available" as const,
  },
  {
    id: "7",
    name: "Rocky",
    species: "Dog",
    breed: "German Shepherd",
    age: "5 years",
    gender: "Male",
    location: "Happy Tails",
    image:
      "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=500&h=500&fit=crop",
    status: "adopted" as const,
  },
  {
    id: "8",
    name: "Cleo",
    species: "Cat",
    breed: "Siamese",
    age: "3 years",
    gender: "Female",
    location: "Kitty Haven",
    image:
      "https://images.unsplash.com/photo-1513245543132-31f507417b26?w=500&h=500&fit=crop",
    status: "available" as const,
  },
];

export default function AdoptPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredPets = allPets.filter((pet) => {
    const matchesSearch =
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecies =
      speciesFilter === "all" || pet.species === speciesFilter;
    const matchesStatus =
      statusFilter === "all" || pet.status === statusFilter;
    return matchesSearch && matchesSpecies && matchesStatus;
  });

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary rounded-full p-2">
              <PawPrint className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Adopt a Pet
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Browse through our collection of adorable pets waiting for their
            forever homes. All pets are from verified shelters with complete
            health records.
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
                placeholder="Search by name or breed..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Species</SelectItem>
                  <SelectItem value="Dog">Dogs</SelectItem>
                  <SelectItem value="Cat">Cats</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="adopted">Adopted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Pet Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {filteredPets.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Showing {filteredPets.length} pets
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPets.map((pet) => (
                  <PetCard key={pet.id} {...pet} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <PawPrint className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No pets found
              </h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSpeciesFilter("all");
                  setStatusFilter("all");
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
