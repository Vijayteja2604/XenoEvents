import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface RegistrationDialogProps {
  isOpen: boolean;
  eventName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function RegistrationDialog({
  isOpen,
  eventName,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: RegistrationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-sm rounded-xl bg-[#F9F9F8] [&>button]:hidden">
        <DialogHeader className="text-center">
          <DialogTitle className="text-center">
            Confirm Registration
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            You are about to register for
            <span className="text-black text-lg font-semibold block pt-3">
              {eventName}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between space-x-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isLoading}
          >
            Go Back
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-blue-500 hover:bg-blue-600"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registering
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
