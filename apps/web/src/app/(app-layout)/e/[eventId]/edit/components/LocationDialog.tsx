import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Globe } from "lucide-react";
import { useState } from "react";
import Location from "@/app/(app-layout)/create/components/Location";

interface LocationDialogProps {
  locationType: "venue" | "online" | null;
  location: {
    place_id?: string;
    description: string;
    isCustom?: boolean;
    structured_formatting?: {
      main_text: string;
      secondary_text: string;
    };
    latitude?: number;
    longitude?: number;
  } | null;
  meetingLink: string;
  additionalDetails: string;
  locationAdditionalDetails: string;
  onLocationTypeChange: (type: "venue" | "online" | null) => void;
  onLocationChange: (
    location: {
      place_id?: string;
      description: string;
      isCustom?: boolean;
      structured_formatting?: {
        main_text: string;
        secondary_text: string;
      };
      latitude?: number;
      longitude?: number;
    } | null
  ) => void;
  onMeetingLinkChange: (link: string) => void;
  onAdditionalDetailsChange: (details: string) => void;
  onLocationAdditionalDetailsChange: (details: string) => void;
}

export default function LocationDialog({
  locationType,
  location,
  meetingLink,
  additionalDetails,
  locationAdditionalDetails,
  onLocationTypeChange,
  onLocationChange,
  onMeetingLinkChange,
  onAdditionalDetailsChange,
  onLocationAdditionalDetailsChange,
}: LocationDialogProps) {
  const [open, setOpen] = useState(false);
  const [tempLocationType, setTempLocationType] = useState(locationType);
  const [tempLocation, setTempLocation] = useState(location);
  const [tempMeetingLink, setTempMeetingLink] = useState(meetingLink);
  const [tempAdditionalDetails, setTempAdditionalDetails] =
    useState(additionalDetails);
  const [tempLocationAdditionalDetails, setTempLocationAdditionalDetails] =
    useState(locationAdditionalDetails);

  const handleSave = () => {
    onLocationTypeChange(tempLocationType);
    if (tempLocation) {
      // Pass through the location object with latitude and longitude as direct properties
      onLocationChange(tempLocation);
    } else {
      onLocationChange(null);
    }
    onMeetingLinkChange(tempMeetingLink);
    onAdditionalDetailsChange(tempAdditionalDetails);
    onLocationAdditionalDetailsChange(tempLocationAdditionalDetails);
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // When opening, initialize temp values
      setTempLocationType(locationType);
      setTempLocation(location);
      setTempMeetingLink(meetingLink);
      setTempAdditionalDetails(additionalDetails);
      setTempLocationAdditionalDetails(locationAdditionalDetails);
    }
    setOpen(newOpen);
  };

  const getLocationSummary = () => {
    if (!locationType) return "No location set";
    if (locationType === "venue") {
      if (location?.structured_formatting) {
        return `${location.structured_formatting.main_text}, ${location.structured_formatting.secondary_text}`;
      }
      return location?.description || "No venue specified";
    }
    return meetingLink || "No meeting link specified";
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {locationType === "venue" ? (
                <MapPin className="h-4 w-4" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              <span className="font-medium">
                {locationType === "venue" ? "Venue" : "Online"}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              Edit
            </Button>
          </div>
          <p className="text-sm">{getLocationSummary()}</p>
          {locationAdditionalDetails && (
            <p className="text-sm text-muted-foreground">
              {locationAdditionalDetails}
            </p>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-xs sm:max-w-lg rounded-xl bg-[#F9F9F8] [&>button]:hidden">
        <DialogHeader className="text-center">
          <DialogTitle>Edit Location</DialogTitle>
        </DialogHeader>
        <Location
          locationType={tempLocationType}
          location={tempLocation}
          onLocationTypeChange={setTempLocationType}
          onLocationChange={setTempLocation}
          meetingLink={tempMeetingLink}
          onMeetingLinkChange={setTempMeetingLink}
          additionalDetails={tempLocationAdditionalDetails}
          onAdditionalDetailsChange={setTempLocationAdditionalDetails}
        />
        <DialogFooter className="mt-6">
          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
