import { Link } from "react-router-dom";
import { PawPrint, Mail, Phone, MapPin } from "lucide-react";
import { formatIndianPhone, toIndianTelHref } from "@/lib/phone";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-primary rounded-full p-2">
                <PawPrint className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">PetHaven</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Connecting pets with loving homes. Your trusted platform for pet adoption, lost & found, and veterinary services.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/adopt" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Adopt a Pet
                </Link>
              </li>
              <li>
                <Link to="/lost-found" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Lost & Found
                </Link>
              </li>
              <li>
                <Link to="/report-injured" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Report Injured Animal
                </Link>
              </li>
              <li>
                <Link to="/vet-services" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Veterinary Services
                </Link>
              </li>
            </ul>
          </div>

          {/* For Partners */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">For Partners</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/shelters" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Register Shelter
                </Link>
              </li>
              <li>
                <Link to="/vet-services" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Join as Veterinarian
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                support@pethaven.com
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <a href={`tel:${toIndianTelHref("9876543210")}`} className="hover:text-primary transition-colors">
                  {formatIndianPhone("9876543210")}
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                123 Pet Street, Animal City
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Copyright 2026 PetHaven. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
