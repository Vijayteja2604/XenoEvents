import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  PenLineIcon,
  Share2Icon,
  ExternalLinkIcon,
  Presentation,
  ScanLine,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  differenceInMinutes,
  parseISO,
  formatDistanceToNow,
  format,
} from "date-fns";
import ShareDialog from "./ShareDialog";
import { useEventOverview } from "@/hooks/settings/useSettings";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Keep the CountdownTime interface
interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
}

const getMeetingPlatform = (url: string) => {
  if (url.includes("meet.google.com")) return "google-meet";
  if (url.includes("zoom.us")) return "zoom";
  if (url.includes("skype.com")) return "skype";
  return "other";
};

export default function Overview() {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [countdown, setCountdown] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
  });
  const [eventStatus, setEventStatus] = useState<
    "upcoming" | "ongoing" | "ended"
  >("upcoming");
  const [endedTimeAgo, setEndedTimeAgo] = useState("");
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const params = useParams();
  const eventId = params.eventId as string;

  const { data: event, isLoading, error } = useEventOverview(eventId);

  useEffect(() => {
    if (!event) return;

    const calculateTimeLeft = () => {
      const startDate = parseISO(event.startDate);
      const endDate = parseISO(event.endDate);
      const now = new Date();

      const minutesToStart = differenceInMinutes(startDate, now);
      const minutesToEnd = differenceInMinutes(endDate, now);

      if (minutesToEnd <= 0) {
        setEventStatus("ended");
        setEndedTimeAgo(formatDistanceToNow(endDate, { addSuffix: true }));
        return { days: 0, hours: 0, minutes: 0 };
      }

      if (minutesToStart <= 0) {
        setEventStatus("ongoing");
        return { days: 0, hours: 0, minutes: 0 };
      }

      setEventStatus("upcoming");
      const days = Math.floor(minutesToStart / (24 * 60));
      const hours = Math.floor((minutesToStart % (24 * 60)) / 60);
      const minutes = minutesToStart % 60;

      return { days, hours, minutes };
    };

    // Initial calculation
    setCountdown(calculateTimeLeft());

    // Update countdown every minute
    const timer = setInterval(() => {
      setCountdown(calculateTimeLeft());
    }, 60000);

    return () => clearInterval(timer);
  }, [event]);

  const formatDate = (isoString: string) => {
    return format(parseISO(isoString), "EEE, MMMM d");
  };

  const formatTime = (isoString: string) => {
    return format(parseISO(isoString), "h:mm a");
  };

  if (isLoading) {
    return (
      <div className="space-y-3 pb-6">
        {/* Top section with status and view button */}
        <div className="flex flex-row justify-between items-center gap-4 sm:gap-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:gap-3">
            <Skeleton className="h-5 w-40" /> {/* "Starting in" text */}
          </div>
          <Skeleton className="h-9 w-28" /> {/* View Event button */}
        </div>

        {/* Main content card */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="space-y-4">
            <div className="flex flex-col items-center">
              {/* Event title */}
              <Skeleton className="h-8 w-64 mb-3" />

              {/* Event image */}
              <div className="sm:w-[350px] relative">
                <Skeleton className="w-full h-[262px] rounded-lg" />

                {/* Date/time section */}
                <div className="flex items-center justify-between text-gray-600 text-xs sm:text-sm mt-5">
                  <Skeleton className="h-16 w-28 rounded-lg" />
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-16 w-28 rounded-lg" />
                </div>
              </div>
            </div>

            {/* Location section */}
            <div>
              <Skeleton className="h-6 w-24 mb-1" />
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-5 w-48 mt-1" />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 w-full mt-4">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg col-span-2 sm:col-span-1 mt-1 sm:mt-0" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!event) {
    return <div>No event data available</div>;
  }

  return (
    <div className="space-y-3 pb-6">
      <div className="flex flex-row justify-between items-center gap-4 sm:gap-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:gap-3">
          <div className="text-gray-600 text-sm font-medium">
            {eventStatus === "ended"
              ? "Event ended"
              : eventStatus === "ongoing"
              ? ""
              : "Starting in"}
          </div>
          {eventStatus === "ended" ? (
            <div className="text-gray-600 font-medium">{endedTimeAgo}</div>
          ) : eventStatus === "ongoing" ? (
            <div className="flex items-center gap-1.5 animate-pulse">
              <div className="text-emerald-600 rounded-lg px-2 py-1.5 font-semibold tracking-tight text-lg">
                Going on now
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 animate-pulse">
              <div className="text-blue-500 rounded-lg px-0.5 py-1.5 font-semibold tracking-tight flex flex-row items-center">
                <span className="text-base sm:text-lg">{countdown.days}</span>
                <span className="text-xs sm:text-sm ml-1">days</span>
              </div>
              <div className="text-blue-500 rounded-lg px-0.5 py-1.5 font-semibold tracking-tight flex flex-row items-center">
                <span className="text-base sm:text-lg">{countdown.hours}</span>
                <span className="text-xs sm:text-sm ml-1">hrs</span>
              </div>
              <div className="text-blue-500 rounded-lg px-0.5 py-1.5 font-semibold tracking-tight flex flex-row items-center">
                <span className="text-base sm:text-lg">
                  {countdown.minutes}
                </span>
                <span className="text-xs sm:text-sm ml-1">min</span>
              </div>
            </div>
          )}
        </div>
        <Link
          href={`/e/${eventId}`}
          className="bg-blue-500 hover:bg-blue-600 rounded-lg px-4 py-2 font-medium text-sm tracking-tight flex items-center justify-center gap-2 text-white transition-colors border-none"
        >
          <ExternalLinkIcon className="size-4" />
          <span>View Event</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="space-y-4">
          <div className="flex flex-col items-center">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mb-3 text-center">
              {event.name}
            </h2>
            <div className="sm:w-[350px] relative">
              <Image
                src={event.coverImage || "/event-placeholder-1.png"}
                alt={`Cover image for ${event.name}`}
                className="rounded-lg object-cover"
                draggable={false}
                width={350}
                height={262}
                priority
                placeholder="blur"
                blurDataURL="/event-placeholder-1.png"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = "/event-placeholder-1.png";
                }}
                style={{
                  width: "100%",
                  height: "auto",
                  aspectRatio: "350/262",
                }}
              />
              <div className="flex items-center justify-between text-gray-600 text-xs sm:text-sm mt-5">
                <div className="flex flex-col items-center bg-blue-50 rounded-lg px-2 py-1 sm:px-4 sm:py-2">
                  <p className="font-medium">{formatDate(event.startDate)}</p>
                  <p>{formatTime(event.startDate)}</p>
                </div>
                <div className="text-muted-foreground font-medium text-sm">
                  to
                </div>
                <div className="flex flex-col items-center bg-blue-50 rounded-lg px-2 py-1 sm:px-4 sm:py-2">
                  <p className="font-medium">{formatDate(event.endDate)}</p>
                  <p>{formatTime(event.endDate)}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium mb-1">
              {event.locationType === "ONLINE" ? "Online Event" : "Location"}
            </h3>
            <div className="text-gray-500">
              {event.locationType === "ONLINE" ? (
                <>
                  {event.meetingLink && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex items-center gap-3 w-full">
                        {(() => {
                          const platform = getMeetingPlatform(
                            event.meetingLink
                          );
                          switch (platform) {
                            case "google-meet":
                              return (
                                <Image
                                  src="/Google-meet.svg"
                                  alt="Google Meet"
                                  width={24}
                                  height={24}
                                />
                              );
                            case "zoom":
                              return (
                                <Image
                                  src="/Zoom.svg"
                                  alt="Zoom"
                                  width={24}
                                  height={24}
                                />
                              );
                            case "skype":
                              return (
                                <Image
                                  src="/Skype.svg"
                                  alt="Skype"
                                  width={24}
                                  height={24}
                                />
                              );
                            default:
                              return (
                                <Presentation className="w-6 h-6 text-blue-500" />
                              );
                          }
                        })()}
                        <p className="text-xs sm:text-sm truncate max-w-xl">
                          {event.meetingLink}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="text-blue-500 hover:text-blue-600 w-full sm:w-auto"
                        onClick={() => window.open(event.meetingLink as string)}
                      >
                        Start Meeting
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="font-medium text-sm sm:text-base">
                    {event.location?.mainText ||
                      event.location?.locationAdditionalDetails}
                  </p>
                  <p className="text-xs sm:text-sm truncate max-w-xl">
                    {event.location?.secondaryText ||
                      event.location?.locationAdditionalDetails}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {eventStatus !== "ended" && (
        <div
          className={`flex flex-col ${
            event.locationType === "VENUE" ? "sm:grid sm:grid-cols-3" : ""
          } gap-2 sm:gap-4 w-full mt-4`}
        >
          <div
            className={`grid ${
              event.locationType === "VENUE"
                ? "order-2 sm:order-1 grid-cols-2 sm:contents"
                : "grid-cols-2"
            } gap-2`}
          >
            <button
              onClick={() => setIsShareDialogOpen(true)}
              className="font-medium tracking-tight flex flex-row items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 bg-white rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Share2Icon className="size-3 sm:size-4" />
              <span className="text-sm sm:text-base">Share Event</span>
            </button>
            <Link
              href={`/e/${eventId}/edit`}
              className="font-medium tracking-tight flex flex-row items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 bg-white rounded-lg hover:bg-gray-50 transition-colors"
            >
              <PenLineIcon className="size-3 sm:size-4" />
              <span className="text-sm sm:text-base">Edit Event</span>
            </Link>
          </div>
          {event.locationType === "VENUE" && (
            <Link
              href={`/e/${eventId}/check-in`}
              className="order-1 sm:order-2 font-medium tracking-tight flex flex-row items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 bg-black text-white rounded-lg hover:bg-black/80 transition-colors"
            >
              <ScanLine className="size-5" />
              <span className="text-sm sm:text-base">Check In</span>
            </Link>
          )}
        </div>
      )}
      <ShareDialog
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        shareUrl={shareUrl}
      />
    </div>
  );
}
