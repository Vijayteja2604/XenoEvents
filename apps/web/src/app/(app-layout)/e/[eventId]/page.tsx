/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import {
  Calendar,
  MapPin,
  ExternalLinkIcon,
  InfoIcon,
  Ticket as TicketIcon,
  ShieldCheck,
  ChevronDown,
  Presentation,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useState, useEffect } from "react";
import { notFound, usePathname } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import RegistrationDialog from "@/components/dialogs/RegistrationDialog";

import {
  differenceInMinutes,
  parseISO,
  formatDistanceToNow,
  isWithinInterval,
  subDays,
  format,
} from "date-fns";
import RegistrationInfoDialog from "@/components/dialogs/RegistrationInfoDialog";
import { SignInForm } from "@/components/dialogs/SignInDialog";
import { SignUpForm } from "@/components/dialogs/SignUpDialog";
import {
  useGetEvent,
  useEventRole,
  useRegisterForEvent,
  useRegistrationStatus,
} from "@/hooks/event/useEvent";
import { useUser } from "@/hooks/auth/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type EventLocation = {
  isCustom: boolean;
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  additionalDetails?: string;
};

// Add the RichTextContent type
interface RichTextContent {
  type: string;
  content: Array<{
    type: string;
    content?: Array<{
      type: string;
      text?: string;
      marks?: Array<{
        type: string;
      }>;
    }>;
  }>;
}

type EventData = {
  title: string;
  organizer: string;
  coverImage: string;
  dateTime: {
    start: {
      isoString: string;
    };
    end: {
      isoString: string;
    };
  };
  location: EventLocation | null;
  meetingLink: string | null;
  isInPerson: boolean;
  createdAt: string;
  description: string | RichTextContent;
  website: string | null;
  contact: Array<{
    name: string;
    email: string;
    phone: string;
  }>;
  registration: {
    price: string;
    requiresApproval: boolean;
  };
  spotsLeft: number | null;
};

const formatDate = (isoString: string) => {
  return format(parseISO(isoString), "EEE, MMMM d");
};

const formatTime = (isoString: string) => {
  return format(parseISO(isoString), "h:mm a");
};

const getMeetingPlatform = (url: string) => {
  if (url.includes("meet.google.com")) return "google-meet";
  if (url.includes("zoom.us")) return "zoom";
  if (url.includes("skype.com")) return "skype";
  return "other";
};

// Update the ReadOnlyEditor component
function ReadOnlyEditor({ content }: { content: string | RichTextContent }) {
  const editor = useEditor(
    {
      extensions: [StarterKit, Underline],
      content: typeof content === "string" ? JSON.parse(content) : content,
      editable: false,
      editorProps: {
        attributes: {
          class: "prose prose-sm sm:prose max-w-none",
        },
      },
      immediatelyRender: false,
      parseOptions: {
        preserveWhitespace: true,
      },
    },
    []
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="prose prose-sm sm:prose max-w-none">
      <EditorContent editor={editor} />
    </div>
  );
}

// Update the isValidJSON function to handle both types
const isValidJSON = (content: string | RichTextContent): boolean => {
  if (typeof content !== "string") {
    return true; // If it's already a RichTextContent object, it's valid
  }
  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
};

export default function EventPage({ params }: { params: { eventId: string } }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [authLoading] = useState(false);
  const [showRegistrationConfirm, setShowRegistrationConfirm] = useState(false);
  const [showRegistrationInfo, setShowRegistrationInfo] = useState(false);
  const { data: userData } = useUser();
  const user = !!userData;
  const [eventStatus, setEventStatus] = useState<
    "upcoming" | "ongoing" | "ended"
  >("upcoming");
  const [endedTimeAgo, setEndedTimeAgo] = useState("");
  const pathname = usePathname();

  // Get event data first
  const { getEvent } = useGetEvent(params.eventId);
  const { data: event, isLoading: isEventLoading } = getEvent;

  // Get user event role only if we have an event
  const {
    role,
    isLoading: isRoleLoading,
    error: roleError,
  } = useEventRole(params.eventId);

  const isAdmin =
    !isRoleLoading && !roleError && (role === "ADMIN" || role === "CREATOR");

  useEffect(() => {
    if (roleError) {
      console.error("Error fetching user role:", roleError);
    }
  }, [roleError]);

  // Register for event
  const { registerForEvent, isRegistering } = useRegisterForEvent(
    params.eventId
  );

  // Get registration status
  const { isRegistered: registrationStatus, registration } =
    useRegistrationStatus(params.eventId);

  // Transform API response to match the UI data structure
  const eventData: EventData = {
    title: event?.name ?? "",
    organizer: event?.organizer ?? "",
    coverImage: event?.coverImage ?? "",
    dateTime: {
      start: {
        isoString: event?.startDate ?? "",
      },
      end: {
        isoString: event?.endDate ?? "",
      },
    },
    location: event?.location
      ? {
          placeId: event.location.placeId || "",
          name: event.location.mainText || event.location.description || "",
          address:
            event.location.secondaryText || event.location.description || "",
          latitude: event.location.latitude || 0,
          longitude: event.location.longitude || 0,
          additionalDetails: event.location.locationAdditionalDetails || "",
          isCustom: event.location.isCustom || false,
        }
      : null,
    meetingLink: event?.meetingLink || null,
    isInPerson: event?.locationType === "VENUE",
    createdAt: event?.createdAt ?? "",
    description: event?.description ?? "",
    website: event?.websiteUrl || null,
    contact:
      event?.contactPersons.map((contact) => ({
        name: contact.name || "",
        email: contact.email || "",
        phone: contact.phone || "",
      })) ?? [],
    registration: {
      price: event?.priceType === "FREE" ? "Free" : `₹ ${event?.price}`,
      requiresApproval: event?.requireApproval ?? false,
    },
    spotsLeft: event?.spotsLeft ?? null,
  };

  useEffect(() => {
    if (!event) return; // Add this check to prevent errors when event is null

    const calculateEventStatus = () => {
      const startDate = parseISO(eventData.dateTime.start.isoString);
      const endDate = parseISO(eventData.dateTime.end.isoString);
      const now = new Date();

      const minutesToEnd = differenceInMinutes(endDate, now);
      const minutesToStart = differenceInMinutes(startDate, now);

      if (minutesToEnd <= 0) {
        setEventStatus("ended");
        setEndedTimeAgo(formatDistanceToNow(endDate, { addSuffix: true }));
      } else if (minutesToStart <= 0) {
        setEventStatus("ongoing");
      } else {
        setEventStatus("upcoming");
      }
    };

    calculateEventStatus();
    const timer = setInterval(calculateEventStatus, 60000);
    return () => clearInterval(timer);
  }, [
    event,
    eventData.dateTime.start.isoString,
    eventData.dateTime.end.isoString,
  ]);

  const handleRegisterClick = () => {
    if (!user) {
      setAuthMode("signup");
      setIsDialogOpen(true);
    } else {
      setShowRegistrationConfirm(true);
    }
  };

  const handleRegistrationConfirm = async () => {
    try {
      await registerForEvent.mutateAsync();
      setShowRegistrationConfirm(false); // Close the confirmation dialog
      toast.success("Successfully registered for the event!");

      // Reload the page after a short delay to show the toast
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message === "EVENT_FULL") {
          setShowRegistrationConfirm(false);
          toast.error("This event has reached maximum capacity");
        } else if (
          error.message === "You are already registered for this event"
        ) {
          setShowRegistrationConfirm(false);
          toast.error("You are already registered for this event");
        } else if (
          error.message === "You must be logged in to register for events"
        ) {
          setShowRegistrationConfirm(false);
          setAuthMode("signup");
          setIsDialogOpen(true);
          toast.error("Please sign in to register for events");
        } else {
          // Handle any other errors
          toast.error("Failed to register for event. Please try again.");
        }
      }
      console.error("Registration error:", error);
    }
  };

  const handleSwitchToSignUp = () => {
    setAuthMode("signup");
  };

  const handleSwitchToSignIn = () => {
    setAuthMode("signin");
  };

  const isRecentlyAdded = () => {
    const createdDate = parseISO(eventData.createdAt);
    const lastWeek = subDays(new Date(), 7);

    return isWithinInterval(createdDate, {
      start: lastWeek,
      end: new Date(),
    });
  };
  
  // Add password state

  if (isEventLoading) {
    return (
      <div className="pb-24 sm:pb-8 sm:-mx-[10rem] px-3 sm:px-0">
        {/* Hero Image Skeleton */}
        <div className="relative h-[300px] sm:h-[400px] rounded-xl overflow-hidden shadow-lg mb-8">
          <Skeleton className="h-full w-full" />
        </div>

        {/* Mobile Tickets Skeleton - Fixed at bottom */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-24 mt-1" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Badges and Title */}
        <div className="space-y-6 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-5 w-48" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
          {/* Main Content */}
          <div className="flex-[2]">
            <div className="bg-white rounded-xl p-4 sm:p-8 space-y-8 shadow-sm">
              {/* Date and Time */}
              <div className="space-y-6">
                <div className="flex gap-4 sm:gap-6 items-start">
                  <Skeleton className="w-6 h-6" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-24" />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Skeleton className="h-8 w-40" />
                      <Skeleton className="h-8 w-40" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 sm:gap-6 items-start">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-24" />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Skeleton className="h-8 w-40" />
                      <Skeleton className="h-8 w-40" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 sm:gap-6 items-start">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-24" />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Skeleton className="h-8 w-40" />
                      <Skeleton className="h-8 w-40" />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex gap-4 sm:gap-6 items-start">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden sm:block flex-1">
            <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    notFound();
  }

  return (
    <div className="pb-24 sm:pb-8 sm:-mx-[10rem] px-3 sm:px-0">
      <div className="relative h-[200px] sm:h-[500px] rounded-xl overflow-hidden shadow-lg mb-8">
        {/* Fallback div that shows when image fails */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-8">
          <h1 className="text-white text-4xl sm:text-8xl font-bold text-center">{eventData.title}</h1>
        </div>
        <div className="relative w-full h-full [&>span]:!absolute [&>span]:inset-0">
          <Image
            src={eventData.coverImage || "/event-placeholder-1.png"}
            alt=""
            className="object-cover hover:scale-105 transition-transform duration-500 relative z-10"
            fill
            priority
            draggable={false}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Mobile Admin Access - Add this section */}
      {isAdmin && eventStatus !== "ended" && (
        <div
          className={cn(
            "sm:hidden fixed bottom-[50px] left-0 right-0 bg-blue-500 border-t p-4 pb-8 z-40",
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-medium">Admin Access</span>
            </div>
            <Link
              href={`/e/${params.eventId}/settings`}
              className="text-sm text-white"
            >
              Manage event →
            </Link>
          </div>
        </div>
      )}

      {/* Mobile Tickets - Fixed at bottom */}
      {eventStatus !== "ended" && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40">
          {registrationStatus ? (
            <div className="flex items-center justify-between">
              <p className="font-semibold text-lg tracking-tight">Registered</p>
              {registration?.isApproved ? (
                <>
                  {!eventData.isInPerson && eventData.meetingLink ? (
                    <Button
                      className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                      onClick={() =>
                        window.open(eventData.meetingLink as string)
                      }
                    >
                      <Presentation className="w-4 h-4" />
                      Join Meeting
                    </Button>
                  ) : !eventData.isInPerson && !eventData.meetingLink ? (
                    <div>Registered for the event</div>
                  ) : (
                    <Button
                      className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                      onClick={() =>
                        window.open(
                          `/e/ticket/${registration?.ticketId}`,
                          "_blank"
                        )
                      }
                    >
                      <TicketIcon className="w-4 h-4" />
                      View Ticket
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Waiting for approval</p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-[6px]">
                  <p className="font-semibold text-lg">
                    {eventData.registration.price}
                  </p>
                  {eventData.registration.requiresApproval && (
                    <span
                      className="mt-[2px]"
                      onClick={() => setShowRegistrationInfo(true)}
                    >
                      <InfoIcon className="size-3 text-muted-foreground cursor-pointer hover:text-gray-900" />
                    </span>
                  )}
                </div>
                {eventData.spotsLeft !== null && (
                  <p className="text-muted-foreground text-sm">
                    {eventData.spotsLeft === 0
                      ? "Registrations closed"
                      : `${eventData.spotsLeft} spot${
                          eventData.spotsLeft === 1 ? "" : "s"
                        } left`}
                  </p>
                )}
              </div>
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleRegisterClick}
                disabled={eventData.spotsLeft === 0}
              >
                Register
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Badges and Title */}
      <div className="space-y-6 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          {eventStatus === "ended" ? (
            <div className="flex items-center gap-2 text-gray-600 text-base">
              <span className="font-medium">Event ended</span>
              <span className="text-muted-foreground">{endedTimeAgo}</span>
            </div>
          ) : null}
          {isRecentlyAdded() && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-700 hover:bg-green-200 transition-colors px-3 py-1 text-sm"
            >
              Recently Added
            </Badge>
          )}
          {eventData.isInPerson && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-500 hover:bg-blue-200 transition-colors px-3 py-1 text-sm"
            >
              In Person
            </Badge>
          )}
          {!eventData.isInPerson && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-500 hover:bg-blue-200 transition-colors px-3 py-1 text-sm"
            >
              Online
            </Badge>
          )}
        </div>

        {/* Title, organizer and countdown section */}
        <div className="sm:space-y-2">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              {eventData.title}
            </h2>
            {eventStatus === "ongoing" && (
              <div className="flex items-center gap-1.5 animate-pulse flex-shrink-0">
                <div className="text-emerald-600 rounded-lg px-2 py-1.5 font-semibold tracking-tight text-lg">
                  Going on now
                </div>
              </div>
            )}
          </div>
          <div className="sm:ml-2 text-muted-foreground">
            by <span className="font-medium">{eventData.organizer}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
        <div className="flex-[2] mb-10">
          <CardContent className="bg-white rounded-xl p-4 sm:p-8 space-y-8 shadow-sm">
            <div className="space-y-6">
              <div className="flex gap-4 sm:gap-6 items-start">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mt-1 text-blue-500" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-base sm:text-lg">
                    Date and time
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 pt-2">
                    <div className="bg-blue-50 rounded-lg px-3 py-2">
                      <p className="font-medium text-xs sm:text-sm">
                        {formatDate(eventData.dateTime.start.isoString)} at{" "}
                        {formatTime(eventData.dateTime.start.isoString)}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-xs sm:text-sm">
                      to
                    </span>
                    <div className="bg-blue-50 rounded-lg px-3 py-2">
                      <p className="font-medium text-xs sm:text-sm">
                        {formatDate(eventData.dateTime.end.isoString)} at{" "}
                        {formatTime(eventData.dateTime.end.isoString)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {eventData.isInPerson && eventData.location && (
                <div className="flex gap-4 sm:gap-6 items-start">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 mt-1 text-blue-500" />
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg">
                      Location
                    </h3>
                    <p className="font-medium text-base sm:text-lg">
                      {eventData.location.name}
                    </p>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      {eventData.location.address}
                    </p>
                    {eventData.location.additionalDetails && (
                      <p className="text-muted-foreground mt-2 text-xs sm:text-sm">
                        Additional Details:{" "}
                        {eventData.location.additionalDetails}
                      </p>
                    )}
                    {!eventData.location.isCustom && (
                      <Button
                        variant="link"
                        className="px-0 text-blue-500 hover:text-blue-600 flex items-center gap-1"
                        onClick={() => setShowMap(!showMap)}
                    >
                      {showMap ? "Hide map" : "Show map"}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          showMap ? "rotate-180" : ""
                        }`}
                        />
                      </Button>
                    )}
                    {showMap && (
                      <div className="space-y-2">
                        <div className="mt-1 w-full rounded-md overflow-hidden">
                          <img
                            src={`https://maps.googleapis.com/maps/api/staticmap?center=${eventData.location.latitude},${eventData.location.longitude}&zoom=15&size=600x200&scale=2&markers=${eventData.location.latitude},${eventData.location.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                            alt="Event location map"
                            className="w-full h-[200px] object-cover"
                          />
                        </div>
                        <a
                          href={`https://www.google.com/maps/place/?q=place_id:${eventData.location.placeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-center text-sm text-blue-500 hover:text-blue-600 hover:underline"
                        >
                          View on Google Maps
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!eventData.isInPerson && (
                <div className="flex gap-4 sm:gap-6 items-start">
                  <div className="flex-shrink-0">
                    {eventData.meetingLink ? (
                      (() => {
                        const platform = getMeetingPlatform(
                          eventData.meetingLink
                        );
                        switch (platform) {
                          case "google-meet":
                            return (
                              <Image
                                src="/Google-meet.svg"
                                alt="Google Meet"
                                width={24}
                                height={24}
                                className="mt-1"
                              />
                            );
                          case "zoom":
                            return (
                              <Image
                                src="/Zoom.svg"
                                alt="Zoom"
                                width={24}
                                height={24}
                                className="mt-1"
                              />
                            );
                          case "skype":
                            return (
                              <Image
                                src="/Skype.svg"
                                alt="Skype"
                                width={24}
                                height={24}
                                className="mt-1"
                              />
                            );
                          default:
                            return (
                              <Presentation className="w-5 h-5 sm:w-6 sm:h-6 mt-1 text-blue-500" />
                            );
                        }
                      })()
                    ) : (
                      <Presentation className="w-5 h-5 sm:w-6 sm:h-6 mt-1 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg">
                      Online Event
                    </h3>
                  </div>
                </div>
              )}

              {eventData.website && (
                <div className="flex gap-4 sm:gap-6 items-start">
                  <ExternalLinkIcon className="w-5 h-5 sm:w-6 sm:h-6 mt-1 text-blue-500" />
                  <div className="-space-y-4">
                    <h3 className="font-semibold text-base sm:text-lg">
                      Event Website
                    </h3>
                    <Button
                      variant="link"
                      className="px-0 text-blue-500 hover:text-blue-600"
                      onClick={() => window.open(eventData.website as string)}
                    >
                      Visit website
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-semibold">
                  About the event
                </h2>
                <div className="h-[2px] flex-1 bg-gray-100 rounded-full" />
              </div>
              <div className="prose prose-sm sm:prose max-w-none text-gray-600">
                {isValidJSON(eventData.description) ? (
                  <ReadOnlyEditor content={eventData.description} />
                ) : (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="size-5" />
                    <span>Failed to load event description</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 border-t pt-6">
              <h2 className="text-xl sm:text-2xl font-semibold">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {eventData.contact.map((contact, index) => (
                  <div
                    key={index}
                    className="flex gap-4 items-center p-4 border rounded-lg"
                  >
                    <Avatar className="size-10 rounded-full aspect-square flex-shrink-0">
                      <AvatarImage src={contact.name?.[0] as string} />
                      <AvatarFallback>
                        {contact.name?.split(" ").length > 1
                          ? `${contact.name?.split(" ")[0][0]}${contact.name?.split(" ")[1][0]}`
                          : contact.name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {contact.name}
                      </p>
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-sm text-blue-500 hover:text-blue-600 hover:underline block truncate"
                        title={contact.email}
                      >
                        {contact.email}
                      </a>
                      {contact.phone && (
                        <a
                          href={`tel:+91${contact.phone}`}
                          className="block text-sm text-blue-500 hover:text-blue-600 hover:underline truncate"
                          title={`+91 ${contact.phone}`}
                        >
                          +91 {contact.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </div>

        <div className="hidden sm:block flex-1">
          <div className="sticky top-24 space-y-6 bg-white rounded-xl p-4 sm:p-8 shadow-sm">
            {isAdmin && eventStatus !== "ended" && (
              <>
                <div className="flex flex-col gap-3 p-4 sm:p-6 border rounded-xl bg-blue-50">
                  <div className="flex items-center gap-2 text-blue-500">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="font-medium">Admin Access</span>
                  </div>
                  <Link
                    href={`/e/${params.eventId}/settings`}
                    className="text-sm text-blue-500 hover:text-blue-600 hover:underline"
                  >
                    Manage event settings →
                  </Link>
                </div>
                <Separator />
              </>
            )}

            {registrationStatus ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors gap-4">
                <div className="flex flex-col items-center text-center space-y-4 w-full">
                  <p className="font-semibold text-xl tracking-tight">
                    Registered
                  </p>
                  {registration?.isApproved ? (
                    <>
                      {!eventData.isInPerson && eventData.meetingLink ? (
                        <Button
                          className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto flex items-center gap-2"
                          onClick={() =>
                            window.open(eventData.meetingLink as string)
                          }
                        >
                          <Presentation className="w-4 h-4" />
                          Join Meeting
                        </Button>
                      ) : !eventData.isInPerson && !eventData.meetingLink ? (
                        <div>Registered for the event</div>
                      ) : (
                        <Button
                          className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto flex items-center gap-2"
                          onClick={() =>
                            window.open(
                              `/e/ticket/${registration?.ticketId}`,
                              "_blank"
                            )
                          }
                        >
                          <TicketIcon className="w-4 h-4" />
                          View Ticket
                        </Button>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      Waiting for approval
                    </p>
                  )}
                </div>
              </div>
            ) : eventStatus === "ended" ? (
              <div className="text-center p-4 sm:p-6 border rounded-xl bg-gray-50">
                <p className="font-semibold text-xl tracking-tight text-gray-600">
                  This event has ended
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-xl sm:text-2xl font-semibold">
                  Registration
                </h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors gap-4">
                  <div>
                    <p className="font-semibold text-base sm:text-lg">
                      {eventData.registration.price}
                    </p>
                    {eventData.spotsLeft !== null && (
                      <p className="text-sm text-muted-foreground">
                        {eventData.spotsLeft === 0
                          ? "Registrations closed"
                          : `${eventData.spotsLeft} spot${
                              eventData.spotsLeft === 1 ? "" : "s"
                            } left`}
                      </p>
                    )}
                  </div>
                  <Button
                    className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto"
                    onClick={handleRegisterClick}
                    disabled={eventData.spotsLeft === 0}
                  >
                    Register
                  </Button>
                </div>
                {eventData.registration.requiresApproval && (
                  <p className="text-xs text-muted-foreground italic">
                    * Registration for this event requires approval from the
                    organizer. They will review your request and confirm your
                    spot.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <SignInForm
        open={isDialogOpen && authMode === "signin"}
        onOpenChange={setIsDialogOpen}
        onSwitchToSignUp={handleSwitchToSignUp}
        isLoading={authLoading}
        callbackUrl={pathname}
      />

      <SignUpForm
        open={isDialogOpen && authMode === "signup"}
        onOpenChange={setIsDialogOpen}
        onSwitchToSignIn={handleSwitchToSignIn}
        isLoading={authLoading}
        callbackUrl={pathname}
      />

      <RegistrationDialog
        isOpen={showRegistrationConfirm}
        eventName={eventData.title}
        onOpenChange={setShowRegistrationConfirm}
        onConfirm={handleRegistrationConfirm}
        isLoading={isRegistering}
      />

      <RegistrationInfoDialog
        isOpen={showRegistrationInfo}
        onOpenChange={setShowRegistrationInfo}
        requiresApproval={eventData.registration.requiresApproval}
      />
    </div>
  );
}
