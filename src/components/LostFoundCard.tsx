import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";
import { ContactReporterDialog } from "@/components/ContactReporterDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface LostFoundCardProps {
  id: string;
  type: "lost" | "found";
  petName?: string;
  species: string;
  breed: string;
  color: string;
  location: string;
  date: string;
  description: string;
  image: string;
  contactPhone?: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
}

export function LostFoundCard({
  type, petName, species, breed, color, location, date, description, image,
  reporterName, reporterEmail, reporterPhone,
}: LostFoundCardProps) {
  const [showContact, setShowContact] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleContact = () => {
    if (!user) {
      toast({ title: "Please log in", description: "You need to be logged in to view contact details.", variant: "destructive" });
      navigate("/login");
      return;
    }
    setShowContact(true);
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="relative aspect-video overflow-hidden">
          <img src={image} alt={petName || `${type} ${species}`} className="w-full h-full object-cover" />
          <Badge className={`absolute top-3 left-3 ${type === "lost" ? "bg-destructive text-destructive-foreground" : "bg-green-600 text-white"}`}>
            {type === "lost" ? "Lost" : "Found"}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg text-foreground mb-1">{petName || `${species} - ${breed}`}</h3>
          <p className="text-sm text-muted-foreground mb-3">{breed} • {color}</p>
          <p className="text-sm text-foreground mb-3 line-clamp-2">{description}</p>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /><span>{location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /><span>{date}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button variant="outline" className="w-full" onClick={handleContact}>
            Contact Reporter
          </Button>
        </CardFooter>
      </Card>

      <ContactReporterDialog
        open={showContact}
        onOpenChange={setShowContact}
        reporterName={reporterName}
        reporterEmail={reporterEmail}
        reporterPhone={reporterPhone}
      />
    </>
  );
}
