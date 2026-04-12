import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  link: string;
  color?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  link,
}: FeatureCardProps) {
  return (
    <Link to={link}>
      <Card className="group h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
        <CardContent className="p-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
          </div>
          <h3 className="font-semibold text-lg text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
