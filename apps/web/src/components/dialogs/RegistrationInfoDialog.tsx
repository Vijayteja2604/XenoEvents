import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RegistrationInfoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  requiresApproval: boolean;
}

export default function RegistrationInfoDialog({
  isOpen,
  onOpenChange,
  requiresApproval,
}: RegistrationInfoDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs rounded-xl bg-[#F9F9F8] [&>button]:hidden">
        <DialogHeader className="text-center">
          <DialogTitle className="text-center">
            Registration Information
          </DialogTitle>
          <DialogDescription className="text-center text-sm pt-4">
            {requiresApproval
              ? "Registration for this event requires approval from the organizer. They will review your request and confirm your spot."
              : "Your spot will be confirmed immediately upon registration."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-32"
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
