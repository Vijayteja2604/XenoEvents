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

interface PriceDialogProps {
  isOpen: boolean;
  price: number | null;
  onOpenChange: (open: boolean) => void;
  onPriceChange: (price: number | null) => void;
  onPriceTypeChange: (type: string) => void;
}

export default function PriceDialog({
  isOpen,
  price,
  onOpenChange,
  onPriceChange,
  onPriceTypeChange,
}: PriceDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && (!price || price <= 0)) {
          onPriceTypeChange("free");
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-xs rounded-xl bg-[#F9F9F8] [&>button]:hidden">
        <DialogHeader className="text-center">
          <DialogTitle className="text-center">Set Price</DialogTitle>
          <DialogDescription hidden>
            Enter the price for your event
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Price (₹)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={price || ""}
              onChange={(e) =>
                onPriceChange(e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                onPriceChange(null);
                onPriceTypeChange("free");
                onOpenChange(false);
              }}
            >
              Make Free
            </Button>
            <Button
              onClick={() => {
                if (price && price > 0) {
                  onPriceTypeChange("paid");
                  onOpenChange(false);
                } else {
                  onPriceTypeChange("free");
                  onPriceChange(null);
                  onOpenChange(false);
                }
              }}
            >
              Set Price
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
