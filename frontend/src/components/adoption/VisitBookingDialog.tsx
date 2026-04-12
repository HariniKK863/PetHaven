import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VisitBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  petName: string;
  onSuccess: () => void;
}

export function VisitBookingDialog({ open, onOpenChange, requestId, petName, onSuccess }: VisitBookingDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [time1, setTime1] = useState("");
  const [time2, setTime2] = useState("");
  const [time3, setTime3] = useState("");

  // Get date range for this week
  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  const minDate = today.toISOString().split("T")[0];
  const maxDate = endOfWeek.toISOString().split("T")[0];

  const handleSubmit = async () => {
    if (!visitDate || !time1 || !time2 || !time3) {
      toast({ title: "Missing fields", description: "Please select a date and 3 preferred times.", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from("adoption_requests")
      .update({
        visit_date: visitDate,
        preferred_visit_times: [time1, time2, time3],
      })
      .eq("id", requestId);

    if (error) {
      toast({ title: "Error", description: "Failed to book visit.", variant: "destructive" });
    } else {
      toast({ title: "Visit Times Submitted!", description: "The shelter will confirm one of your preferred times." });
      onSuccess();
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book Shelter Visit for {petName}</DialogTitle>
          <DialogDescription>
            Choose a day this week and 3 preferred time slots. The shelter will approve one.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="visit-date">Visit Date (this week)</Label>
            <Input id="visit-date" type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} min={minDate} max={maxDate} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time1">Preferred Time 1</Label>
            <Input id="time1" type="time" value={time1} onChange={(e) => setTime1(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time2">Preferred Time 2</Label>
            <Input id="time2" type="time" value={time2} onChange={(e) => setTime2(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time3">Preferred Time 3</Label>
            <Input id="time3" type="time" value={time3} onChange={(e) => setTime3(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Visit Times"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
