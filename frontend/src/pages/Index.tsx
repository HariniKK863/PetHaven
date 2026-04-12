import { Layout } from "@/components/Layout";
import { HeroSection } from "@/components/HeroSection";
import { FeatureCard } from "@/components/FeatureCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Heart,
  Search,
  AlertCircle,
  Stethoscope,
  Building2,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Pet Adoption",
    description:
      "Find your perfect companion from our verified shelters with transparent adoption processes.",
    link: "/adopt",
  },
  {
    icon: Search,
    title: "Lost & Found",
    description:
      "Report lost pets or help reunite found animals with their families through our community.",
    link: "/lost-found",
  },
  {
    icon: AlertCircle,
    title: "Report Injured",
    description:
      "Quickly report injured animals for immediate veterinary assistance and care.",
    link: "/report-injured",
  },
  {
    icon: Stethoscope,
    title: "Vet Services",
    description:
      "Book appointments with licensed veterinarians and manage pet medical records.",
    link: "/vet-services",
  },
  {
    icon: Building2,
    title: "Verified Shelters",
    description:
      "Connect with admin-verified animal shelters committed to ethical pet welfare.",
    link: "/shelters",
  },
  {
    icon: ShieldCheck,
    title: "Pet Profiles",
    description:
      "Create and manage comprehensive profiles including medical and vaccination records.",
    link: "/register",
  },
];

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need for Pet Welfare
            </h2>
            <p className="text-muted-foreground">
              A comprehensive platform connecting pet owners, shelters,
              veterinarians, and animal lovers to ensure the best care for our
              furry friends.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Join thousands of pet lovers in our mission to provide loving homes
            for every animal. Register as a pet owner, shelter, or veterinarian
            today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="text-base"
            >
              <Link to="/register">Create Account</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="text-base bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
