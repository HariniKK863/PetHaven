import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PawPrint, Mail, Lock, User, Eye, EyeOff, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("general_user");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const needsCertificate = role === "shelter" || role === "veterinarian";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!agreedToTerms) {
      toast({ title: "Terms required", description: "Please agree to the terms and conditions.", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    if (needsCertificate && !certificateFile) {
      toast({ title: "Certificate required", description: "Please upload your verification certificate/license.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password, fullName, role);

    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // If shelter/vet, upload certificate
    if (needsCertificate && certificateFile) {
      // Get the newly created user
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        const fileExt = certificateFile.name.split(".").pop();
        const fileName = `${newUser.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(fileName, certificateFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("documents").getPublicUrl(fileName);
          await supabase.from("profiles").update({
            verification_document_url: urlData.publicUrl,
            verification_status: "pending",
          }).eq("user_id", newUser.id);
        }
      }
    }

    setIsLoading(false);
    toast({
      title: "Account created!",
      description: needsCertificate
        ? "Your account is pending admin verification. You'll be notified once approved."
        : "Welcome to PetHaven.",
    });
    navigate("/dashboard");
  };

  return (
    <Layout>
      <section className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary rounded-full p-3">
                  <PawPrint className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl">Create Account</CardTitle>
              <CardDescription>Join PetHaven and start your pet journey</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="name" placeholder="Enter your full name" className="pl-10" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="Enter your email" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Create a password (min 6 characters)" className="pl-10 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" className="absolute right-3 top-3 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">I am a</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as AppRole)}>
                    <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general_user">General User</SelectItem>
                      <SelectItem value="pet_owner">Pet Owner</SelectItem>
                      <SelectItem value="shelter">Animal Shelter</SelectItem>
                      <SelectItem value="veterinarian">Veterinarian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {needsCertificate && (
                  <div className="space-y-2">
                    <Label htmlFor="certificate">
                      Upload Certificate/License *
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {role === "shelter"
                        ? "Upload your shelter registration or license document."
                        : "Upload your veterinary license or certification."}
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        id="certificate"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                        required
                      />
                    </div>
                    {certificateFile && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Upload className="h-3 w-3" /> {certificateFile.name}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(checked === true)} />
                  <Label htmlFor="terms" className="text-sm font-normal">
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                  </Label>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">Sign in</Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </section>
    </Layout>
  );
}
