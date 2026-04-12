import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, Search, PawPrint } from "lucide-react";
import heroImage from "@/assets/hero-pets.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Happy pets"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <PawPrint className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium text-primary">
              Welcome to PetHaven
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Find Your Perfect
            <span className="text-primary block">Furry Companion</span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-xl">
            Connect with loving pets waiting for their forever homes. Adopt, report lost & found animals, and access trusted veterinary services all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild className="text-base">
              <Link to="/adopt">
                <Heart className="mr-2 h-5 w-5" />
                Adopt a Pet
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base">
              <Link to="/lost-found">
                <Search className="mr-2 h-5 w-5" />
                Lost & Found
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-border/50">
            <div>
              <p className="text-3xl font-bold text-primary">2,500+</p>
              <p className="text-sm text-muted-foreground">Pets Adopted</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">150+</p>
              <p className="text-sm text-muted-foreground">Verified Shelters</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">500+</p>
              <p className="text-sm text-muted-foreground">Happy Reunions</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
