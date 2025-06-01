import {
  Edit,
  Globe,
  LinkIcon,
  UserRoundCheckIcon,
  EyeIcon,
  TicketIcon,
  Users2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EventOptionsProps {
  priceType: string;
  price: number | null;
  capacity: number | null;
  visibility: string;
  requireApproval: boolean;
  onPriceDialogOpen: () => void;
  onCapacityDialogOpen: () => void;
  onPriceTypeChange: (value: string) => void;
  onVisibilityChange: (value: string) => void;
  onRequireApprovalChange: (value: boolean) => void;
}

export default function EventOptions({
  priceType,
  price,
  capacity,
  visibility,
  requireApproval,
  onPriceDialogOpen,
  onCapacityDialogOpen,
  onPriceTypeChange,
  onVisibilityChange,
  onRequireApprovalChange,
}: EventOptionsProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Additional Options</h3>

      <div className="space-y-3 rounded-md bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5">
              <TicketIcon className="size-4" />
              <Label htmlFor="tickets">Price</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Set up ticketing and registration
            </p>
          </div>
          <div className="flex flex-col items-center sm:flex-row sm:items-center">
            <Select
              value={priceType}
              onValueChange={(value) => {
                if (value === "paid") {
                  onPriceDialogOpen();
                } else {
                  onPriceTypeChange(value);
                }
              }}
            >
              <SelectTrigger
                id="tickets"
                className="w-[75px] border-none text-left font-normal shadow-none hover:bg-gray-50/90"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-none">
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            {priceType === "paid" && (
              <div className="flex items-center rounded-lg p-2 hover:bg-gray-50/90">
                <button
                  onClick={onPriceDialogOpen}
                  className="flex items-center space-x-2 hover:text-foreground/80"
                >
                  <span className="pl-2 text-sm">
                    ₹{price?.toFixed(2) || "0.00"}
                  </span>
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>
        </div>
        <Separator className="bg-black/10" />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5">
              <UserRoundCheckIcon className="size-4" />
              <Label htmlFor="approval">Require Approval</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Approve attendees before they can join
            </p>
          </div>
          <Switch
            id="approval"
            checked={requireApproval}
            onCheckedChange={onRequireApprovalChange}
          />
        </div>
        <Separator className="bg-black/10" />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5">
              <Users2 className="size-4" />
              <Label htmlFor="capacity">Capacity</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Set the maximum number of attendees
            </p>
          </div>
          <div className="flex items-center space-x-2 rounded-lg p-2 hover:bg-gray-50/90">
            <button
              onClick={onCapacityDialogOpen}
              className="flex items-center space-x-2 hover:text-foreground/80"
            >
              <span className="pl-2 text-sm">
                {capacity ? capacity : "Unlimited"}
              </span>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        <Separator className="bg-black/10" />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5">
              <EyeIcon className="size-4" />
              <Label htmlFor="visibility">Visibility</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Create a public event or an unlisted one
            </p>
          </div>
          <div className="flex flex-col items-center sm:flex-row sm:items-center">
            <Select value={visibility} onValueChange={onVisibilityChange}>
              <SelectTrigger
                id="visibility"
                className="w-[90px] border-none text-left font-normal shadow-none hover:bg-gray-50/90"
              >
                <SelectValue defaultValue={visibility}>
                  {visibility === "public" ? "Public" : "Private"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent side="top" className="w-[240px] border-none">
                <SelectItem value="public" textValue="Public">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>Public</span>
                    </div>
                    <span className="text-xs font-normal text-muted-foreground">
                      Shown on your calendar and eligible to be featured.
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="private" textValue="Private">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <span>Private</span>
                    </div>
                    <span className="text-xs font-normal text-muted-foreground">
                      Unlisted. Only people with the link can register.
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
