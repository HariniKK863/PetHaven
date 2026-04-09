import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdoptionRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pet: { id: string; name: string; owner_id: string };
  userId: string;
  onSuccess: () => void;
}

export function AdoptionRequestDialog({ open, onOpenChange, pet, userId, onSuccess }: AdoptionRequestDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    reason: "",
    message: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.full_name || !form.email || !form.phone) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    // Create adoption request
    const { error } = await supabase.from("adoption_requests").insert({
      pet_id: pet.id,
      requester_id: userId,
      shelter_id: pet.owner_id,
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      reason: form.reason,
      message: form.message || null,
    });

    if (error) {
      console.error("Error submitting adoption request:", error);
      toast({ title: "Error", description: "Failed to submit request.", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Update pet status to pending
    await supabase.from("pets").update({ status: "pending" }).eq("id", pet.id);

    // Notify shelter
    await supabase.from("notifications").insert({
      user_id: pet.owner_id,
      title: "New Adoption Request",
      message: `${form.full_name} has requested to adopt ${pet.name}.`,
      type: "adoption_request",
      related_id: pet.id,
    });

    toast({ title: "Request Submitted!", description: "Your adoption request has been sent to the shelter." });
    setSubmitting(false);
    setForm({ full_name: "", email: "", phone: "", address: "", reason: "", message: "" });
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request to Adopt {pet.name}</DialogTitle>
          <DialogDescription>
            Fill in your details below. The shelter will review your request.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input id="full_name" value={form.full_name} onChange={(e) => handleChange("full_name", e.target.value)} placeholder="Your full name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="your@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input id="phone" type="tel" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="Your phone number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={form.address} onChange={(e) => handleChange("address", e.target.value)} placeholder="Your address" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Why do you want to adopt? *</Label>
            <Textarea id="reason" value={form.reason} onChange={(e) => handleChange("reason", e.target.value)} placeholder="Tell us why you'd be a great pet parent..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Additional Message</Label>
            <Textarea id="message" value={form.message} onChange={(e) => handleChange("message", e.target.value)} placeholder="Any other information..." rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
