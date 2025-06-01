import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WebsiteDialogProps {
  isOpen: boolean;
  websiteUrl: string;
  onOpenChange: (open: boolean) => void;
  onWebsiteUrlChange: (url: string) => void;
}

export default function WebsiteDialog({
  isOpen,
  websiteUrl,
  onOpenChange,
  onWebsiteUrlChange,
}: WebsiteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs rounded-xl bg-[#F9F9F8] [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-center">Website URL</DialogTitle>
          <DialogDescription hidden>
            Enter the website URL for your event
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-4">
            <Input
              className="h-8  placeholder:text-xs sm:h-10 sm:text-sm sm:placeholder:text-sm"
              type="url"
              placeholder="https://example.com"
              value={websiteUrl}
              onChange={(e) => onWebsiteUrlChange(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                onWebsiteUrlChange("");
                onOpenChange(false);
              }}
            >
              Clear
            </Button>
            <Button onClick={() => onOpenChange(false)}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
