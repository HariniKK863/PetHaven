import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, Clock, XCircle } from "lucide-react";

interface VerificationUploadProps {
  currentStatus: string | null;
  documentUrl: string | null;
  onUploadComplete: () => void;
}

export function VerificationUpload({ currentStatus, documentUrl, onUploadComplete }: VerificationUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    setUploading(true);

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);

    // Update profile with document URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        verification_document_url: urlData.publicUrl,
        verification_status: "pending",
      })
      .eq("user_id", user.id);

    setUploading(false);

    if (updateError) {
      console.error("Update error:", updateError);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Document Uploaded!",
        description: "Your verification document has been submitted for review.",
      });
      onUploadComplete();
    }
  };

  const getStatusDisplay = () => {
    switch (currentStatus) {
      case "approved":
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Verified</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Rejected - Please upload a new document</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <Clock className="h-5 w-5" />
            <span className="font-medium">Pending Review</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (currentStatus === "approved") {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">Account Verified</p>
              <p className="text-sm text-green-600">Your account has been verified by an administrator.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Account Verification
        </CardTitle>
        <CardDescription>
          Upload your verification documents to activate your account. An administrator will review your documents.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {getStatusDisplay()}

        {documentUrl && currentStatus === "pending" && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Uploaded Document:</p>
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm"
            >
              View Document
            </a>
          </div>
        )}

        {(currentStatus !== "pending" && currentStatus !== "approved") && (
          <div className="space-y-2">
            <Label htmlFor="document">
              Upload Verification Document (License, Registration, etc.)
            </Label>
            <div className="flex gap-2">
              <Input
                id="document"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </div>
            {uploading && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Upload className="h-4 w-4 animate-pulse" />
                Uploading...
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
