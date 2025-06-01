import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface InfoDialogProps {
  heading: string;
  text: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InfoDialog({
  heading,
  text,
  isOpen,
  onOpenChange,
}: InfoDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-sm rounded-xl bg-[#F9F9F8] [&>button]:hidden">
        <DialogHeader className="text-center">
          <DialogTitle className="text-center">{heading}</DialogTitle>
          <DialogDescription className="text-center text-sm pt-2">
            {text}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center">
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
