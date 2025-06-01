"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { parse } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateEvent } from "@/hooks/event/useEvent";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";

// Dynamic imports for components
const CreateEventLayout = dynamic(
  () => import("./components/CreateEventLayout"),
  {
    loading: () => <Skeleton className="h-screen w-full" />,
  }
);
const CreateEventHeader = dynamic(
  () => import("./components/CreateEventHeader")
);
const BasicInfoForm = dynamic(() => import("./components/BasicInfoForm"));
const EventOptions = dynamic(() => import("./components/EventOptions"));
const PriceDialog = dynamic(() => import("./components/Dialogs/PriceDialog"));
const CapacityDialog = dynamic(
  () => import("./components/Dialogs/CapacityDialog")
);
const ContactDialog = dynamic(
  () => import("./components/Dialogs/ContactDialog")
);
const WebsiteDialog = dynamic(
  () => import("./components/Dialogs/WebsiteDialog")
);

interface ContactPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
}

const isValidUrl = (urlString: string): boolean => {
  try {
    // If URL doesn't start with protocol, prepend https://
    const urlWithProtocol = urlString.match(/^https?:\/\//)
      ? urlString
      : `https://${urlString}`;

    new URL(urlWithProtocol);
    return true;
  } catch {
    return false;
  }
};

// const defaultImages = [
//   "/event-placeholder-1.png",
//   "/event-placeholder-2.png",
//   "/event-placeholder-3.png",
// ];

export default function EventCreator() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [eventName, setEventName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [locationType, setLocationType] = useState<"venue" | "online" | null>(
    null
  );
  const [location, setLocation] = useState<{
    place_id?: string;
    description: string;
    isCustom?: boolean;
    structured_formatting?: {
      main_text: string;
      secondary_text: string;
    };
    latitude?: number;
    longitude?: number;
  } | null>(null);
  const [organizer, setOrganizer] = useState("");
  const [description, setDescription] = useState("");
  const [isCapacityDialogOpen, setIsCapacityDialogOpen] = useState(false);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [priceType, setPriceType] = useState("free");
  const [visibility, setVisibility] = useState("public");
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isWebsiteDialogOpen, setIsWebsiteDialogOpen] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [contacts, setContacts] = useState<ContactPerson[]>([
    { id: "1", name: "", email: "", phone: "" },
  ]);
  const [requireApproval, setRequireApproval] = useState(false);
  const [meetingLink, setMeetingLink] = useState("");
  const [locationAdditionalDetails, setLocationAdditionalDetails] =
    useState("");
  const [coverImage, setCoverImage] = useState<
    { file: File; preview: string } | string
  >("/event-placeholder-1.png");
  const router = useRouter();
  const { createEvent } = useCreateEvent();
  const { isLoading: isPageLoading } = useQuery({
    queryKey: ["pageInit"],
    queryFn: async () => {
      return true;
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);

      // Basic field validations with character limits
      if (!eventName.trim()) {
        toast.error("Event name is required");
        return;
      }
      if (eventName.length > 120) {
        toast.error("Event name must be less than 120 characters");
        return;
      }

      if (!description.trim()) {
        toast.error("Description is required");
        return;
      }
      if (description.length > 3000) {
        toast.error("Description must be less than 3000 characters");
        return;
      }

      if (!organizer.trim()) {
        toast.error("Organizer is required");
        return;
      }
      if (organizer.length > 120) {
        toast.error("Organizer name must be less than 120 characters");
        return;
      }

      // Date and time validations
      if (!startDate || !startTime || !endDate || !endTime) {
        toast.error("Start and end date/time are required");
        return;
      }

      // Location validations
      if (!locationType) {
        toast.error("Location type is required");
        return;
      }

      // Meeting link validation for online events
      if (locationType === "online") {
        if (meetingLink) {
          try {
            new URL(meetingLink);
          } catch {
            toast.error("Please enter a valid meeting link URL");
            return;
          }
        }
      }

      // Website URL validation
      if (websiteUrl) {
        if (!isValidUrl(websiteUrl)) {
          toast.error("Please enter a valid website URL", {
            description: "Example: google.com or https://www.google.com",
          });
          return;
        }
        if (websiteUrl.length > 120) {
          toast.error("Website URL must be less than 120 characters");
          return;
        }

        // Add protocol if missing
        const formattedWebsiteUrl = websiteUrl.match(/^https?:\/\//)
          ? websiteUrl
          : `https://${websiteUrl}`;
        setWebsiteUrl(formattedWebsiteUrl);
      }

      // Contact person validations
      const validContacts = contacts.filter((c) => c.name && c.email);
      if (validContacts.length === 0) {
        toast.error(
          "At least one contact person with name and email is required"
        );
        return;
      }

      // Validate contact person fields
      for (const contact of validContacts) {
        if (contact.name.length > 120) {
          toast.error("Contact person name must be less than 120 characters");
          return;
        }
        if (contact.email.length > 120) {
          toast.error("Contact person email must be less than 120 characters");
          return;
        }
        if (contact.phone && contact.phone.length > 20) {
          toast.error("Contact person phone must be less than 20 characters");
          return;
        }
        // Basic email format validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
          toast.error("Please enter valid email addresses for contact persons");
          return;
        }
      }

      // Location details validation
      if (locationType === "venue" && location) {
        if (location.description.length > 120) {
          toast.error("Location description must be less than 120 characters");
          return;
        }
        if (locationAdditionalDetails.length > 120) {
          toast.error(
            "Location additional details must be less than 120 characters"
          );
          return;
        }
      }

      // Price validation
      if (price && price < 0) {
        toast.error("Price cannot be negative");
        return;
      }

      // Capacity validation
      if (capacity && capacity < 1) {
        toast.error("Capacity must be at least 1");
        return;
      }

      // Combine date and time into ISO strings
      const getISOString = (date: Date | undefined, timeStr: string) => {
        if (!date || !timeStr) return undefined;
        const newDate = new Date(date);
        const timeObj = parse(timeStr, "h:mm a", new Date());
        newDate.setHours(timeObj.getHours());
        newDate.setMinutes(timeObj.getMinutes());
        return newDate.toISOString();
      };

      const startDateTime = getISOString(startDate, startTime);
      const endDateTime = getISOString(endDate, endTime);

      if (!startDateTime || !endDateTime) {
        toast.error("Invalid date/time format");
        return;
      }

      let locationData;
      if (locationType === "venue" && location) {
        locationData = {
          placeId: location.place_id,
          description: location.description,
          mainText: location.structured_formatting?.main_text,
          secondaryText: location.structured_formatting?.secondary_text,
          locationAdditionalDetails,
          latitude: location.latitude,
          longitude: location.longitude,
          isCustom: location.isCustom || false,
        };
      }

      let finalCoverImage: string =
        typeof coverImage === "string" ? coverImage : coverImage.preview;

      // If coverImage is a file object, upload it first
      if (typeof coverImage !== "string") {
        const formData = new FormData();
        formData.append("image", coverImage.file);

        const response = await api.uploadEventImage(formData);
        finalCoverImage = response.url;
      }

      const eventData = {
        name: eventName,
        description,
        organizer,
        startDate: startDateTime,
        endDate: endDateTime,
        locationType: locationType.toUpperCase(),
        location: locationData,
        meetingLink: locationType === "online" ? meetingLink : null,
        coverImage: finalCoverImage,
        capacity: capacity,
        price: price || 0,
        priceType: price && price > 0 ? "PAID" : "FREE",
        visibility: visibility.toUpperCase(),
        requireApproval,
        websiteUrl: websiteUrl
          ? websiteUrl.match(/^https?:\/\//)
            ? websiteUrl
            : `https://${websiteUrl}`
          : null,
        contactPersons: validContacts.map(({ name, email, phone }) => ({
          name,
          email,
          phone: phone || null,
        })),
      };

      const result = await createEvent.mutateAsync(eventData);

      // Use startTransition instead of setTimeout
      startTransition(() => {
        toast.success("Event created successfully!");
        router.push(`/e/${result.eventId}`);
      });
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create event"
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    eventName,
    description,
    organizer,
    startDate,
    endDate,
    startTime,
    endTime,
    locationType,
    location,
    meetingLink,
    websiteUrl,
    contacts,
    locationAdditionalDetails,
    price,
    capacity,
    coverImage,
    visibility,
    requireApproval,
    createEvent,
    router,
    startTransition,
  ]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (eventName || description || organizer || startDate || location) {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [eventName, description, organizer, startDate, location]);

  if (isPageLoading) {
    return (
      <div>
        <div className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <Skeleton className="h-[300px] w-full rounded-lg" />
                <div className="absolute bottom-4 right-4"></div>
              </div>
            </div>

            {/* Date and Time */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-[120px] w-full" />
            </div>

            {/* Organizer */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Event Options */}
          <div className="mt-8 space-y-4">
            <Skeleton className="h-5 w-36" />
            <div className="grid gap-4">
              {[1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Footer Button */}
          <div className="mt-8">
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <CreateEventLayout
      onSubmit={handleSubmit}
      submitButtonText={
        isSubmitting || isPending ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isPending ? "Redirecting" : "Creating"}
          </div>
        ) : (
          "Create Event"
        )
      }
      disabled={isSubmitting || isPending}
    >
      <CreateEventHeader
        eventName={eventName}
        onEventNameChange={setEventName}
        coverImage={coverImage}
        onCoverImageChange={setCoverImage}
      />
      <CardContent className="mt-4 space-y-6">
        <BasicInfoForm
          startDate={startDate}
          endDate={endDate}
          startTime={startTime}
          endTime={endTime}
          websiteUrl={websiteUrl}
          description={description}
          organizer={organizer}
          locationType={locationType}
          location={location}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onStartTimeChange={setStartTime}
          onEndTimeChange={setEndTime}
          onWebsiteDialogOpen={() => setIsWebsiteDialogOpen(true)}
          onDescriptionChange={setDescription}
          onOrganizerChange={setOrganizer}
          onLocationTypeChange={setLocationType}
          onLocationChange={setLocation}
          meetingLink={meetingLink}
          onMeetingLinkChange={setMeetingLink}
          additionalDetails={locationAdditionalDetails}
          onAdditionalDetailsChange={setLocationAdditionalDetails}
        />

        <div className="space-y-1">
          <Label htmlFor="contacts">Contact Details</Label>
          <div
            onClick={() => setIsContactDialogOpen(true)}
            className="flex h-9 sm:h-10 w-full cursor-pointer items-center rounded-md border-none bg-white px-3 text-xs text-muted-foreground hover:bg-gray-50/90 sm:text-sm"
          >
            {contacts.some((c) => c.name)
              ? contacts
                  .filter((c) => c.name)
                  .map((c) => c.name)
                  .join(", ")
              : "Add contact persons"}
          </div>
        </div>

        <EventOptions
          priceType={priceType}
          price={price}
          capacity={capacity}
          visibility={visibility}
          requireApproval={requireApproval}
          onPriceDialogOpen={() => setIsPriceDialogOpen(true)}
          onCapacityDialogOpen={() => setIsCapacityDialogOpen(true)}
          onPriceTypeChange={setPriceType}
          onVisibilityChange={setVisibility}
          onRequireApprovalChange={setRequireApproval}
        />

        <PriceDialog
          isOpen={isPriceDialogOpen}
          price={price}
          onOpenChange={setIsPriceDialogOpen}
          onPriceChange={setPrice}
          onPriceTypeChange={setPriceType}
        />

        <CapacityDialog
          isOpen={isCapacityDialogOpen}
          capacity={capacity}
          onOpenChange={setIsCapacityDialogOpen}
          onCapacityChange={setCapacity}
        />

        <ContactDialog
          isOpen={isContactDialogOpen}
          contacts={contacts}
          onOpenChange={setIsContactDialogOpen}
          onContactsChange={setContacts}
        />

        <WebsiteDialog
          isOpen={isWebsiteDialogOpen}
          websiteUrl={websiteUrl}
          onOpenChange={setIsWebsiteDialogOpen}
          onWebsiteUrlChange={setWebsiteUrl}
        />
      </CardContent>
    </CreateEventLayout>
  );
}
