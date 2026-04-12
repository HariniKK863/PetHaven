import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface PetCardProps {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  gender: string;
  location: string;
  image: string;
  status?: "available" | "pending" | "adopted";
}

export function PetCard({
  id,
  name,
  species,
  breed,
  age,
  gender,
  location,
  image,
  status = "available",
}: PetCardProps) {
  const statusColors = {
    available: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    adopted: "bg-muted text-muted-foreground",
  };

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Badge className={`absolute top-3 left-3 ${statusColors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
        <button className="absolute top-3 right-3 p-2 bg-card/80 backdrop-blur-sm rounded-full hover:bg-primary hover:text-primary-foreground transition-colors">
          <Heart className="h-4 w-4" />
        </button>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground">
              {breed} • {gender}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {species}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{age}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span>{location}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full">
          <Link to={`/adopt/${id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
