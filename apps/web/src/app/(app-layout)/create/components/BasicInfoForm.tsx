import { format, isBefore, isEqual, parse } from "date-fns";
import { CalendarIcon, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Location from "./Location";
import RichTextEditor from "./RichTextEditor";

interface BasicInfoFormProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  startTime: string;
  endTime: string;
  websiteUrl: string;
  description: string;
  organizer: string;
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
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  onWebsiteDialogOpen: () => void;
  onDescriptionChange: (description: string) => void;
  onOrganizerChange: (organizer: string) => void;
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
  additionalDetails: string;
  onAdditionalDetailsChange: (details: string) => void;
}

function generateTimeOptions() {
  const options = [];
  for (let i = 0; i < 24; i++) {
    const hour = i % 12 || 12;
    const period = i < 12 ? "AM" : "PM";
    const time = `${hour}:00 ${period}`;
    options.push({
      value: time,
      label: time,
      hour: i,
    });
  }
  return options;
}

export default function BasicInfoForm({
  startDate,
  endDate,
  startTime,
  endTime,
  websiteUrl,
  description,
  organizer,
  locationType,
  location,
  meetingLink,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onWebsiteDialogOpen,
  onDescriptionChange,
  onOrganizerChange,
  onLocationTypeChange,
  onLocationChange,
  onMeetingLinkChange,
  additionalDetails,
  onAdditionalDetailsChange,
}: BasicInfoFormProps) {
  const today = new Date();
  const currentHour = today.getHours();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date && startDate && isBefore(date, startDate)) {
      // If end date is before start date, don't allow selection
      return;
    }
    onEndDateChange(date);
  };

  const handleEndTimeChange = (time: string) => {
    if (startDate && endDate && isEqual(startDate, endDate)) {
      // If dates are same, validate time
      const startTimeObj = parse(startTime, "h:mm a", new Date());
      const endTimeObj = parse(time, "h:mm a", new Date());

      if (isBefore(endTimeObj, startTimeObj)) {
        // If end time is before start time on same day, don't allow selection
        return;
      }
    }
    onEndTimeChange(time);
  };

  const isTimeDisabled = (time: string, isEndTime: boolean) => {
    if (!isEndTime && isEqual(startDate || new Date(), startOfToday)) {
      // For start time on today's date, disable past hours
      const timeObj = parse(time, "h:mm a", new Date());
      const hour = timeObj.getHours();
      return hour < currentHour;
    }

    if (isEndTime) {
      if (!startDate || !endDate || !startTime) return false;
      if (!isEqual(startDate, endDate)) return false;

      const timeObj = parse(time, "h:mm a", new Date());
      const startTimeObj = parse(startTime, "h:mm a", new Date());

      if (isEqual(endDate, startOfToday)) {
        // For end time on today's date, also consider current hour
        return (
          timeObj.getHours() < currentHour || isBefore(timeObj, startTimeObj)
        );
      }

      return isBefore(timeObj, startTimeObj);
    }

    return false;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="start-date">Start</Label>
          <div className="flex w-full gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="start-date"
                  variant="xenoSecondary"
                  className={cn(
                    "flex-1 justify-start text-xs sm:text-sm",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={onStartDateChange}
                  initialFocus
                  disabled={(date) => isBefore(date, startOfToday)}
                />
              </PopoverContent>
            </Popover>
            <Select value={startTime} onValueChange={onStartTimeChange}>
              <SelectTrigger className="w-24 min-w-fit border-none bg-white text-left shadow-none hover:bg-gray-50/90 text-xs sm:text-sm">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                {generateTimeOptions().map(({ value, label }) => (
                  <SelectItem
                    className={cn(
                      "focus:bg-blue-500 focus:text-white",
                      isTimeDisabled(value, false) &&
                        "opacity-50 pointer-events-none"
                    )}
                    key={value}
                    value={value}
                    disabled={isTimeDisabled(value, false)}
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="end-date">End</Label>
          <div className="flex w-full gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="end-date"
                  variant="xenoSecondary"
                  className={cn(
                    "flex-1 justify-start text-xs sm:text-sm",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={handleEndDateSelect}
                  initialFocus
                  disabled={(date) =>
                    isBefore(date, startOfToday) ||
                    (startDate ? isBefore(date, startDate) : false)
                  }
                />
              </PopoverContent>
            </Popover>
            <Select value={endTime} onValueChange={handleEndTimeChange}>
              <SelectTrigger className="w-24 min-w-fit border-none bg-white text-left shadow-none hover:bg-gray-50/90 text-xs sm:text-sm">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                {generateTimeOptions().map(({ value, label }) => (
                  <SelectItem
                    className={cn(
                      "focus:bg-blue-500 focus:text-white",
                      isTimeDisabled(value, true) &&
                        "opacity-50 pointer-events-none"
                    )}
                    key={value}
                    value={value}
                    disabled={isTimeDisabled(value, true)}
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Location
        locationType={locationType}
        location={location}
        onLocationTypeChange={onLocationTypeChange}
        onLocationChange={onLocationChange}
        meetingLink={meetingLink}
        onMeetingLinkChange={onMeetingLinkChange}
        additionalDetails={additionalDetails}
        onAdditionalDetailsChange={onAdditionalDetailsChange}
      />

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <RichTextEditor value={description} onChange={onDescriptionChange} />
      </div>

      <div className="flex w-full flex-row gap-x-4">
        <div className="flex-1 space-y-1">
          <Label htmlFor="organizer">Organizer</Label>
          <Input
            id="organizer"
            value={organizer}
            onChange={(e) => onOrganizerChange(e.target.value)}
            className="h-9 sm:h-10 rounded-md border-none bg-white text-xs shadow-none placeholder:text-xs hover:bg-gray-50/90 sm:text-sm sm:placeholder:text-sm"
            placeholder="Who is hosting the event"
            maxLength={120}
          />
        </div>
        <div className="flex-shrink-0 space-y-1">
          <Label htmlFor="website" className="invisible h-[17px] sm:visible">
            Website
          </Label>
          <div
            onClick={onWebsiteDialogOpen}
            className="flex h-9 sm:h-10 w-[48px] cursor-pointer items-center justify-center rounded-md border-none bg-white hover:bg-gray-50/90 sm:w-[180px] sm:justify-start sm:px-3"
          >
            <Globe
              className={`h-4 w-4 sm:mr-2 ${
                websiteUrl ? "text-blue-500" : "text-gray-500"
              }`}
            />
            <span className="hidden max-w-[130px] overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-foreground sm:block sm:text-sm">
              {websiteUrl || "Add website URL"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
