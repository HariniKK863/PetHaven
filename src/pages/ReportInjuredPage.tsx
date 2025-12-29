import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, MapPin, Phone, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReportInjuredPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast({
        title: "Report Submitted Successfully",
        description: "Our team will respond to this emergency as soon as possible.",
      });
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4">
            <Card className="max-w-lg mx-auto text-center">
              <CardContent className="pt-12 pb-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Report Submitted Successfully
                </h2>
                <p className="text-muted-foreground mb-6">
                  Thank you for reporting this injured animal. Our team has been
                  notified and will respond as quickly as possible. You may
                  receive a call for additional information.
                </p>
                <div className="space-y-3">
                  <Button onClick={() => setIsSubmitted(false)} className="w-full">
                    Submit Another Report
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <a href="/">Return Home</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-to-b from-destructive/10 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-destructive rounded-full p-2">
              <AlertCircle className="h-6 w-6 text-destructive-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Report Injured Animal
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            If you've found an injured animal, please fill out this form as
            quickly as possible. Our team will dispatch help immediately.
          </p>
        </div>
      </section>

      {/* Form and Info */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Report Form</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="animal-type">Animal Type</Label>
                        <Select required>
                          <SelectTrigger id="animal-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dog">Dog</SelectItem>
                            <SelectItem value="cat">Cat</SelectItem>
                            <SelectItem value="bird">Bird</SelectItem>
                            <SelectItem value="wildlife">Wildlife</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="severity">Severity Level</Label>
                        <Select required>
                          <SelectTrigger id="severity">
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="critical">Critical - Life Threatening</SelectItem>
                            <SelectItem value="serious">Serious - Needs Immediate Care</SelectItem>
                            <SelectItem value="moderate">Moderate - Stable but Injured</SelectItem>
                            <SelectItem value="minor">Minor - Can Wait</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="location"
                          placeholder="Enter the exact location where the animal was found"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description of Injuries</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the animal's condition and any visible injuries..."
                        rows={4}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="reporter-name">Your Name</Label>
                        <Input id="reporter-name" placeholder="Enter your name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reporter-phone">Your Phone</Label>
                        <Input
                          id="reporter-phone"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="can-stay">Can you stay with the animal?</Label>
                      <Select>
                        <SelectTrigger id="can-stay">
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes, I can wait</SelectItem>
                          <SelectItem value="limited">For a limited time</SelectItem>
                          <SelectItem value="no">No, I cannot stay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit Emergency Report"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Info Sidebar */}
            <div className="space-y-6">
              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-destructive" />
                    Emergency Hotline
                  </h3>
                  <p className="text-2xl font-bold text-destructive mb-2">
                    1-800-PET-HELP
                  </p>
                  <p className="text-sm text-muted-foreground">
                    For critical emergencies, call immediately
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Response Times
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-destructive">Critical:</span>
                      <span className="text-muted-foreground">15-30 minutes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-orange-600">Serious:</span>
                      <span className="text-muted-foreground">30-60 minutes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-yellow-600">Moderate:</span>
                      <span className="text-muted-foreground">1-2 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium text-green-600">Minor:</span>
                      <span className="text-muted-foreground">Same day</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-4">
                    While You Wait
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Keep the animal calm and warm</li>
                    <li>• Do not attempt to move severely injured animals</li>
                    <li>• Keep a safe distance from wild animals</li>
                    <li>• Avoid giving food or water</li>
                    <li>• Note any changes in condition</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
