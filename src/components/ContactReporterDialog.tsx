import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Phone, Mail, User } from "lucide-react";

interface ContactReporterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
}

export function ContactReporterDialog({
  open, onOpenChange, reporterName, reporterEmail, reporterPhone,
}: ContactReporterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reporter Details</DialogTitle>
          <DialogDescription>Contact information for the person who reported this.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {reporterName && (
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{reporterName}</p>
              </div>
            </div>
          )}
          {reporterEmail && (
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <a href={`mailto:${reporterEmail}`} className="font-medium text-primary hover:underline">
                  {reporterEmail}
                </a>
              </div>
            </div>
          )}
          {reporterPhone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <a href={`tel:${reporterPhone}`} className="font-medium text-primary hover:underline">
                  {reporterPhone}
                </a>
              </div>
            </div>
          )}
          {!reporterName && !reporterEmail && !reporterPhone && (
            <p className="text-muted-foreground text-center py-4">No contact information available.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
