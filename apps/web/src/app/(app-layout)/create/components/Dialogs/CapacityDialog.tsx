import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CapacityDialogProps {
  isOpen: boolean;
  capacity: number | null;
  onOpenChange: (open: boolean) => void;
  onCapacityChange: (capacity: number | null) => void;
}

export default function CapacityDialog({
  isOpen,
  capacity,
  onOpenChange,
  onCapacityChange,
}: CapacityDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs rounded-xl bg-[#F9F9F8] [&>button]:hidden">
        <DialogHeader className="text-center">
          <DialogTitle className="text-center">Set Max Capacity</DialogTitle>
          <DialogDescription hidden>
            Enter the capacity for your event
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Auto-close registration when the capacity is reached. Only approved
            guests count towards the cap.
          </p>
          <div className="space-y-1">
            <Label>Capacity</Label>
            <Input
              type="number"
              placeholder="50"
              value={capacity || ""}
              onChange={(e) =>
                onCapacityChange(e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                onCapacityChange(null);
                onOpenChange(false);
              }}
            >
              Remove Limit
            </Button>
            <Button onClick={() => onOpenChange(false)}>Set Limit</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
