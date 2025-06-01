import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Check } from "lucide-react";

interface ColorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultColors: string[];
  onColorChange: (color: string) => void;
}

export default function ColorDialog({
  isOpen,
  onOpenChange,
  defaultColors,
  onColorChange,
}: ColorDialogProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="top-[50%] mx-auto max-w-xs translate-y-[-50%] rounded-xl bg-[#F9F9F8] sm:max-w-sm [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-center">
            Choose Background Color
          </DialogTitle>
          <DialogDescription hidden>
            Enter the color theme for your event
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-2">
            {defaultColors.map((color) => (
              <button
                key={color}
                className={`relative h-8 w-8 rounded-full transition-transform hover:scale-110 focus:outline-none ${
                  selectedColor === color
                    ? "ring-2 ring-offset-2 ring-blue-500"
                    : "focus:ring-0"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  setSelectedColor(color);
                  onColorChange(color);
                  onOpenChange(false);
                }}
              >
                {selectedColor === color && (
                  <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-end space-x-2">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
