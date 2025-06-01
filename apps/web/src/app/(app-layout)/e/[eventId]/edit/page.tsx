"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, isBefore, isEqual, parse, set } from "date-fns";
import {
  CalendarIcon,
  Users2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Underline as UnderlineIcon,
  Undo,
  Redo,
  Loader2,
  XIcon,
  SettingsIcon,
  GlobeIcon,
  LinkIcon,
} from "lucide-react";
import LocationDialog from "./components/LocationDialog";
import ContactDialog from "./components/ContactDialog";
import { Switch } from "@/components/ui/switch";
import { notFound, useParams, useRouter } from "next/navigation";
import { useGetEvent, useEditEvent, useEventRole } from "@/hooks/event/useEvent";
import { toast } from "sonner";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import ImageUploadDialog from "@/app/(app-layout)/create/components/Dialogs/ImageUploadDialog";
import { api } from "@/lib/api";
import Link from "next/link";

type ContactPerson = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

interface Location {
  place_id?: string;
  description: string;
  isCustom?: boolean;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
  latitude?: number;
  longitude?: number;
}

const DEFAULT_COVER_IMAGE = "/event-placeholder-1.png";

const EditEventPage = () => {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const { getEvent } = useGetEvent(eventId);
  const { editEvent, isEditing } = useEditEvent(eventId);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [eventName, setEventName] = useState("");
  const [locationType, setLocationType] = useState<"venue" | "online" | null>(
    "venue"
  );
  const [location, setLocation] = useState<Location | null>(null);
  const [organizer, setOrganizer] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState<number | null>(null);
  const [visibility, setVisibility] = useState("public");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [locationAdditionalDetails, setLocationAdditionalDetails] =
    useState("");
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [isImageUploadDialogOpen, setIsImageUploadDialogOpen] = useState(false);
  const [coverImage, setCoverImage] = useState<{ file: File; preview: string } | string>("");
  const [originalImage, setOriginalImage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { role, isLoading: isLoadingRole, error } = useEventRole(eventId);

  // Load initial event data
  useEffect(() => {
    if (getEvent.data) {
      const event = getEvent.data;
      setEventName(event.name);

      // Handle description from database
      if (event.description) {
        try {
          // If it's a string, try to parse it
          const parsedDescription =
            typeof event.description === "string"
              ? JSON.parse(event.description)
              : event.description;

          // Set the raw JSON string
          setDescription(
            typeof parsedDescription === "string"
              ? parsedDescription
              : JSON.stringify(parsedDescription)
          );
        } catch {
          // If parsing fails, create a new document structure
          setDescription(
            JSON.stringify({
              type: "doc",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text:
                        typeof event.description === "string"
                          ? event.description
                          : String(event.description),
                    },
                  ],
                },
              ],
            })
          );
        }
      }

      setOrganizer(event.organizer);

      // Handle date and time
      const startDateTime = new Date(event.startDate);
      const endDateTime = new Date(event.endDate);

      setStartDate(startDateTime);
      setEndDate(endDateTime);
      setStartTime(format(startDateTime, "h:mm a"));
      setEndTime(format(endDateTime, "h:mm a"));

      setLocationType(event.locationType === "VENUE" ? "venue" : "online");
      if (event.location) {
        setLocation({
          place_id: event.location.placeId || undefined,
          description: event.location.description,
          isCustom: event.location.isCustom,
          structured_formatting: {
            main_text: event.location.mainText || "",
            secondary_text: event.location.secondaryText || "",
          },
          latitude: event.location.latitude || undefined,
          longitude: event.location.longitude || undefined,
        });
        setLocationAdditionalDetails(
          event.location.locationAdditionalDetails || ""
        );
      }
      setMeetingLink(event.meetingLink || "");
      setWebsiteUrl(event.websiteUrl || "");
      setCapacity(event.capacity);
      setVisibility(event.visibility.toLowerCase());
      setRequireApproval(event.requireApproval);
      setContacts(
        event.contactPersons.map((cp) => ({
          id: cp.id,
          name: cp.name,
          email: cp.email,
          phone: cp.phone,
        }))
      );
    }
  }, [getEvent.data]);

  useEffect(() => {
    if (getEvent.data?.coverImage) {
      setCoverImage(getEvent.data.coverImage);
      setOriginalImage(getEvent.data.coverImage);
    }
  }, [getEvent.data?.coverImage]);

  const handleImageSelect = (imageData: { file: File; preview: string } | string) => {
    setCoverImage(imageData);
  };

  const editor = useEditor(
    {
      extensions: [StarterKit, Underline],
      content: description ? JSON.parse(description) : null,
      editorProps: {
        attributes: {
          class:
            "prose prose-sm sm:prose max-w-none focus:outline-none min-h-[100px] px-3 py-2",
        },
      },
      onUpdate: ({ editor }) => {
        const json = editor.getJSON();
        setDescription(JSON.stringify(json));
      },
      parseOptions: {
        preserveWhitespace: true,
      },
      autofocus: false,
      immediatelyRender: false,
    },
    [
      /* empty dependency array */
    ]
  );

  // Update editor content when description changes
  useEffect(() => {
    if (editor && description) {
      // Get current cursor position
      const pos = editor.view.state.selection.$head.pos;

      // Only update content if it's different from current content
      const currentContent = JSON.stringify(editor.getJSON());
      if (currentContent !== description) {
        const content = JSON.parse(description);
        editor.commands.setContent(content, false); // false means don't emit update event

        // Restore cursor position
        editor.commands.setTextSelection(pos);
      }
    }
  }, [editor, description]);

  const generateTimeOptions = () => {
    const times = [];
    for (let i = 0; i < 24; i++) {
      for (let m = 0; m < 60; m += 30) {
        const hour = i % 12 || 12;
        const period = i < 12 ? "AM" : "PM";
        const minute = m === 0 ? "00" : m;
        const time = `${hour}:${minute} ${period}`;
        times.push({
          value: time,
          label: time,
          hour: i,
          minute: m,
        });
      }
    }
    return times;
  };

  const isTimeDisabled = (time: string, isEndTime: boolean) => {
    if (!startDate || !endDate) return false;

    const timeObj = parse(time, "h:mm a", new Date());

    if (!isEndTime) {
      // For start time, only disable if it's today and time is in the past
      if (isEqual(startDate, new Date())) {
        return isBefore(timeObj, new Date());
      }
      return false;
    }

    // For end time
    if (!startTime || !isEqual(startDate, endDate)) return false;

    const startTimeObj = parse(startTime, "h:mm a", new Date());
    return isBefore(timeObj, startTimeObj);
  };

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    if (startDate) {
      const timeObj = parse(time, "h:mm a", startDate);
      setStartDate(
        set(startDate, {
          hours: timeObj.getHours(),
          minutes: timeObj.getMinutes(),
        })
      );
    }
  };

  const handleEndTimeChange = (time: string) => {
    setEndTime(time);
    if (endDate) {
      const timeObj = parse(time, "h:mm a", endDate);
      setEndDate(
        set(endDate, {
          hours: timeObj.getHours(),
          minutes: timeObj.getMinutes(),
        })
      );
    }
  };

  // Add a helper function to format URLs
  const formatUrl = (url: string) => {
    if (!url) return "";
    if (url.match(/^https?:\/\//)) return url;
    return `https://${url}`;
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    try {
      setIsSubmitting(true); // Start loading state

      let finalCoverImage = typeof coverImage === 'string' ? coverImage : undefined;

      // If coverImage is a file object, upload it first
      if (typeof coverImage !== 'string' && coverImage.file) {
        const formData = new FormData();
        formData.append("image", coverImage.file);

        try {
          const response = await api.uploadEventImage(formData);
          finalCoverImage = response.url;
        } catch (error) {
          console.error("Error uploading image:", error);
          toast.error("Failed to upload image");
          setIsSubmitting(false); // Reset loading state on error
          return;
        }
      }

      const eventData = {
        name: eventName,
        description: description,
        organizer,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        locationType: locationType === "venue" ? "VENUE" : "ONLINE",
        location: location
          ? {
              placeId: location.place_id,
              description: location.description,
              isCustom: location.isCustom,
              mainText: location.structured_formatting?.main_text,
              secondaryText: location.structured_formatting?.secondary_text,
              locationAdditionalDetails,
              latitude: location.latitude,
              longitude: location.longitude,
            }
          : undefined,
        meetingLink:
          locationType === "online"
            ? meetingLink
              ? formatUrl(meetingLink)
              : null
            : null,
        websiteUrl: websiteUrl ? formatUrl(websiteUrl) : "",
        capacity,
        visibility: visibility.toUpperCase(),
        requireApproval,
        priceType: "FREE" as const,
        contactPersons: contacts,
        coverImage: finalCoverImage,
      };

      await editEvent.mutateAsync(eventData, {
        onSuccess: () => {
          toast.success("Event updated successfully");
          // Navigate and reload
          router.push(`/e/${eventId}`);
          // Add a small delay before reload to ensure navigation completes
          setTimeout(() => {
            window.location.reload();
          }, 200);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update event");
        },
        onSettled: () => {
          setIsSubmitting(false); // Reset loading state after completion
        },
      });
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event");
      setIsSubmitting(false); // Reset loading state on error
    }
  };

  const handleRemoveNewImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the click from triggering the dialog
    setCoverImage(originalImage);
  };

  if (getEvent.isLoading || isLoadingRole) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl">
          <div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
              Edit Event
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Make changes to your event details and settings
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Info Section Skeleton */}
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-white/50 p-6">
              <h2 className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-7 w-32" />
              </h2>
              <Skeleton className="mt-1 h-4 w-48" />
            </div>

            <div className="space-y-6 p-6">
              <div className="space-y-5">
                {/* Cover Image Skeleton */}
                <Skeleton className="aspect-video w-full rounded-lg" />

                {/* Event Name Skeleton */}
                <div>
                  <Skeleton className="h-4 w-24 mb-1.5" />
                  <Skeleton className="h-10 w-full" />
                </div>

                {/* Date/Time Skeleton */}
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-16" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-16" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                </div>

                {/* Location Skeleton */}
                <div>
                  <Skeleton className="h-4 w-20 mb-1.5" />
                  <Skeleton className="h-10 w-full" />
                </div>

                {/* Organizer Skeleton */}
                <div>
                  <Skeleton className="h-4 w-24 mb-1.5" />
                  <Skeleton className="h-10 w-full" />
                </div>

                {/* Description Skeleton */}
                <div>
                  <Skeleton className="h-4 w-24 mb-1.5" />
                  <Skeleton className="h-[240px] w-full rounded-lg" />
                </div>

                {/* Contact Details Skeleton */}
                <div>
                  <Skeleton className="h-4 w-32 mb-1.5" />
                  <Skeleton className="h-10 w-full" />
                </div>

                {/* Website Skeleton */}
                <div>
                  <Skeleton className="h-4 w-20 mb-1.5" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Options Section Skeleton */}
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-white/50 p-6">
              <h2 className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-7 w-40" />
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button Skeleton */}
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (error || (!isLoadingRole && !["ADMIN", "CREATOR"].includes(role || ""))) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl">
        <div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Edit Event
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Make changes to your event details and settings
          </p>
        </div>
        <div className="max-w-fit sm:max-w-none">
          <Link
            href={`/e/${params.eventId}/settings`}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Event Settings</span>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Info Section */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-white/50 p-6">
            <h2 className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarIcon className="h-4 w-4" />
              </span>
              Basic Information
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Essential details about your event
            </p>
          </div>

          <div className="space-y-6 p-6">
            <div className="space-y-5">
              <div className="relative aspect-video overflow-hidden rounded-xl">
                <div className="relative h-full w-full">
                  <Image
                    src={
                      typeof coverImage === 'string' && coverImage
                        ? coverImage
                        : typeof coverImage === 'object' && coverImage.preview
                          ? coverImage.preview
                          : DEFAULT_COVER_IMAGE
                    }
                    alt="Event cover"
                    fill
                    className="object-cover"
                    draggable={false}
                    priority
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = DEFAULT_COVER_IMAGE;
                    }}
                  />
                  {typeof coverImage !== 'string' && coverImage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-7 w-7 rounded-full bg-rose-500/80 p-1.5 hover:bg-rose-500 text-white hover:text-white z-10"
                      onClick={handleRemoveNewImage}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Button
                  className="absolute bottom-4 py-5 px-4 sm:px-6 right-4 text-sm font-semibold"
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsImageUploadDialogOpen(true)}
                >
                  Change Image
                </Button>
              </div>

              <div>
                <Label htmlFor="event-name" className="text-sm font-medium">
                  Event Name
                </Label>
                <Input
                  id="event-name"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Enter event name"
                  className="mt-1.5"
                />
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Start</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="w-full">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="h-4 w-4 shrink-0" />
                            {startDate
                              ? format(startDate, "PPP")
                              : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            disabled={(date) => isBefore(date, new Date())}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Select
                      value={startTime}
                      onValueChange={handleStartTimeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Time" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateTimeOptions().map(({ value, label }) => (
                          <SelectItem
                            key={value}
                            value={value}
                            disabled={isTimeDisabled(value, false)}
                            className={cn(
                              "focus:bg-blue-500 focus:text-white",
                              isTimeDisabled(value, false) &&
                                "opacity-50 pointer-events-none"
                            )}
                          >
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">End</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="w-full">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="h-4 w-4 shrink-0" />
                            {endDate ? format(endDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            disabled={(date) =>
                              startDate ? isBefore(date, startDate) : false
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Select value={endTime} onValueChange={handleEndTimeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Time" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateTimeOptions().map(({ value, label }) => (
                          <SelectItem
                            key={value}
                            value={value}
                            disabled={isTimeDisabled(value, true)}
                            className={cn(
                              "focus:bg-blue-500 focus:text-white",
                              isTimeDisabled(value, true) &&
                                "opacity-50 pointer-events-none"
                            )}
                          >
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-sm font-medium">
                  Location
                </Label>
                <LocationDialog
                  locationType={locationType}
                  location={location}
                  onLocationTypeChange={setLocationType}
                  onLocationChange={setLocation}
                  meetingLink={meetingLink}
                  onMeetingLinkChange={setMeetingLink}
                  additionalDetails={additionalDetails}
                  onAdditionalDetailsChange={setAdditionalDetails}
                  locationAdditionalDetails={locationAdditionalDetails}
                  onLocationAdditionalDetailsChange={
                    setLocationAdditionalDetails
                  }
                />
              </div>

              <div>
                <Label
                  htmlFor="event-organizer"
                  className="text-sm font-medium"
                >
                  Organizer
                </Label>
                <Input
                  id="event-organizer"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  placeholder="Enter event organizer"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <div className="mt-1.5 border border-gray-200 rounded-lg p-0.5">
                  <div className="relative min-h-[240px] rounded-md border-none bg-white text-xs font-normal shadow-none hover:bg-gray-50/90 sm:text-sm overflow-hidden">
                    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b bg-white/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-white/75">
                      {editor && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 1 })
                                .run()
                            }
                            className={cn(
                              "h-8 px-3 py-2 hover:bg-gray-100",
                              editor.isActive("heading", { level: 1 }) &&
                                "bg-gray-100"
                            )}
                          >
                            <Heading1 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              editor
                                .chain()
                                .focus()
                                .toggleHeading({ level: 2 })
                                .run()
                            }
                            className={cn(
                              "h-8 px-3 py-2 hover:bg-gray-100",
                              editor.isActive("heading", { level: 2 }) &&
                                "bg-gray-100"
                            )}
                          >
                            <Heading2 className="h-4 w-4" />
                          </Button>

                          <Separator
                            orientation="vertical"
                            className="mx-1 h-6"
                          />

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              editor.chain().focus().toggleBold().run()
                            }
                            className={cn(
                              "h-8 px-3 py-2 hover:bg-gray-100",
                              editor.isActive("bold") && "bg-gray-100"
                            )}
                          >
                            <Bold className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              editor.chain().focus().toggleItalic().run()
                            }
                            className={cn(
                              "h-8 px-3 py-2 hover:bg-gray-100",
                              editor.isActive("italic") && "bg-gray-100"
                            )}
                          >
                            <Italic className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              editor.chain().focus().toggleUnderline().run()
                            }
                            className={cn(
                              "h-8 px-3 py-2 hover:bg-gray-100",
                              editor.isActive("underline") && "bg-gray-100"
                            )}
                          >
                            <UnderlineIcon className="h-4 w-4" />
                          </Button>

                          <Separator
                            orientation="vertical"
                            className="mx-1 h-6"
                          />

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              editor.chain().focus().toggleBulletList().run()
                            }
                            className={cn(
                              "h-8 px-3 py-2 hover:bg-gray-100",
                              editor.isActive("bulletList") && "bg-gray-100"
                            )}
                          >
                            <List className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              editor.chain().focus().toggleOrderedList().run()
                            }
                            className={cn(
                              "h-8 px-3 py-2 hover:bg-gray-100",
                              editor.isActive("orderedList") && "bg-gray-100"
                            )}
                          >
                            <ListOrdered className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              editor.chain().focus().toggleBlockquote().run()
                            }
                            className={cn(
                              "h-8 px-3 py-2 hover:bg-gray-100",
                              editor.isActive("blockquote") && "bg-gray-100"
                            )}
                          >
                            <Quote className="h-4 w-4" />
                          </Button>

                          <Separator
                            orientation="vertical"
                            className="mx-1 h-6"
                          />

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editor.chain().focus().undo().run()}
                            disabled={!editor.can().undo()}
                          >
                            <Undo className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editor.chain().focus().redo().run()}
                            disabled={!editor.can().redo()}
                          >
                            <Redo className="h-4 w-4" />
                          </Button>

                          <Separator
                            orientation="vertical"
                            className="mx-1 h-6"
                          />
                        </>
                      )}
                    </div>
                    <div className="px-2">
                      <EditorContent editor={editor} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Contact Details</Label>
                <div>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => setIsContactDialogOpen(true)}
                  >
                    <Users2 className="h-4 w-4" />
                    {contacts.filter((c) => c.name && c.email).length === 0
                      ? "Add contact details"
                      : `${
                          contacts.filter((c) => c.name && c.email).length
                        } contact${
                          contacts.filter((c) => c.name && c.email).length > 1
                            ? "s"
                            : ""
                        } added`}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="event-website" className="text-sm font-medium">
                  Website
                </Label>
                <Input
                  id="event-website"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="Enter event website"
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Options Section */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-white/50 p-6">
            <h2 className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users2 className="h-4 w-4" />
              </span>
              Additional Options
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure event settings and restrictions
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
            {/* Visibility Option */}
            <div className="space-y-4 rounded-lg border p-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">Visibility</Label>
                <p className="text-sm text-muted-foreground">
                  Control who can see your event
                </p>
              </div>
              <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger
                id="visibility"
              >
                <SelectValue defaultValue={visibility}>
                  {visibility === "public" ? "Public" : "Private"}
                </SelectValue>
              </SelectTrigger>
                <SelectContent side="top" className="w-[240px] border-none">
                <SelectItem value="public" textValue="Public">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <GlobeIcon className="h-4 w-4 text-muted-foreground" />
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

            {/* Capacity Option */}
            <div className="space-y-2 rounded-lg border p-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">Capacity</Label>
                <p className="text-sm text-muted-foreground">
                  Maximum number of attendees (leave empty for unlimited)
                </p>
              </div>
              <Input
                type="number"
                value={capacity === null ? "" : capacity}
                onChange={(e) => {
                  const inputValue = e.target.value.trim();
                  setCapacity(inputValue === "" ? null : Number(inputValue));
                }}
                placeholder="Enter capacity"
              />
              {capacity === null && (
                <p className="text-xs text-emerald-500">
                  Unlimited attendees
                </p>
              )}
            </div>

            {/* Require Approval Option */}
            <div className="space-y-4 rounded-lg border p-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">Require Approval</Label>
                <p className="text-sm text-muted-foreground">
                  Approve attendees before they can join
                </p>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="require-approval" className="font-normal">
                  {requireApproval ? "Approval required" : "No approval required"}
                </Label>
                <Switch
                  id="require-approval"
                  checked={requireApproval}
                  onCheckedChange={setRequireApproval}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Changes Button */}
        <Button
          onClick={handleSubmit}
          className="w-full bg-blue-500 hover:bg-blue-600 rounded-lg"
          disabled={isEditing || isSubmitting}
        >
          {isEditing || isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>

      <ContactDialog
        isOpen={isContactDialogOpen}
        contacts={contacts}
        onOpenChange={setIsContactDialogOpen}
        onContactsChange={setContacts}
      />

      <ImageUploadDialog
        isOpen={isImageUploadDialogOpen}
        onOpenChange={setIsImageUploadDialogOpen}
        onImageSelect={handleImageSelect}
      />
    </div>
  );
};

export default EditEventPage;
