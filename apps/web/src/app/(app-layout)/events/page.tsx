"use client";

import { Button } from "@/components/ui/button";
import {
  MapPin,
  Users,
  TicketIcon,
  SettingsIcon,
  PlusIcon,
  PresentationIcon,
  ChevronDownIcon,
  ScanLine,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGetUserEvents } from "@/hooks/event/useEvent";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

// Function to format date
const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
  });
};

// Function to format mobile date (shorter version)
const formatMobileDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
  });
};

// Function to format time
const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Function to check if dates are on the same day
const isSameDay = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return (
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate()
  );
};

// Function to check if an event is upcoming
const isUpcomingEvent = (isoString: string) => {
  const eventDate = new Date(isoString);
  return eventDate > new Date();
};

// Add this function after the isUpcomingEvent function
const isOngoingEvent = (startDate: string, endDate: string) => {
  const now = new Date();
  const eventStart = new Date(startDate);
  const eventEnd = new Date(endDate);
  return now >= eventStart && now <= eventEnd;
};

export default function EventsPage() {
  const { events, isLoading } = useGetUserEvents();
  const [showCompleted, setShowCompleted] = useState(false);

  // Separate ongoing, upcoming and completed events
  const ongoingEvents = events.filter((event) =>
    isOngoingEvent(event.startDate, event.endDate)
  );
  const upcomingEvents = events.filter(
    (event) =>
      !isOngoingEvent(event.startDate, event.endDate) &&
      isUpcomingEvent(event.startDate)
  );
  const completedEvents = events.filter(
    (event) =>
      !isOngoingEvent(event.startDate, event.endDate) &&
      !isUpcomingEvent(event.startDate)
  );

  // Check if there are any active events (ongoing or upcoming)
  const hasActiveEvents = ongoingEvents.length > 0 || upcomingEvents.length > 0;

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
          Events
        </h2>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start gap-3 shadow-md"
            >
              {/* Main content wrapper */}
              <div className="flex flex-row justify-between w-full gap-3">
                {/* Event details */}
                <div className="space-y-1.5 flex-grow min-w-0">
                  <div>
                    <Skeleton className="h-7 sm:h-8 w-48 mb-1" />
                    <Skeleton className="h-4 w-40" />
                  </div>

                  <div className="space-y-0.5 mt-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-3.5 flex-shrink-0 text-gray-400" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="size-3.5 flex-shrink-0 text-gray-400" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </div>

                {/* Image skeleton */}
                <div className="flex-shrink-0">
                  <Skeleton className="size-[88px] sm:w-[180px] sm:h-[130px] rounded-lg" />
                </div>
              </div>

              {/* Mobile actions */}
              <div className="sm:hidden flex items-center gap-2 w-full">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : !hasActiveEvents ? (
        <>
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-gray-50/80 p-14 rounded-full">
                <TicketIcon className="size-40 text-gray-300" />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight">
                No upcoming events
              </h3>
              <p className="text-gray-500 max-w-[400px]">
                You are not a part of any upcoming events at the moment. Explore
                events or create your own!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/explore">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-none"
                >
                  Explore events
                </Button>
              </Link>
              <Link href="/create">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto">
                  <PlusIcon />
                  Create an event
                </Button>
              </Link>
            </div>
          </div>

          {/* Show completed events below empty state if they exist */}
          {completedEvents.length > 0 && (
            <div>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 pt-4"
              >
                <h3 className="text-2xl font-semibold bg-gradient-to-r from-gray-600 to-gray-400 bg-clip-text text-transparent">
                  Completed Events
                </h3>
                <ChevronDownIcon
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    showCompleted ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showCompleted && (
                <div className="space-y-6 mt-6">
                  {completedEvents.map((event) => (
                    <div
                      key={event.eventId}
                      className="bg-white rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start gap-3 shadow-md hover:scale-105 transition-all duration-300"
                    >
                      {/* Main content wrapper */}
                      <div className="flex flex-row justify-between w-full gap-3">
                        {/* Event details */}
                        <div className="space-y-1.5 flex-grow min-w-0">
                          <Link href={`/e/${event.eventId}`} className="block">
                            <div className="pb-2">
                              <h2 className="text-lg sm:text-xl font-semibold truncate">
                                {event.name}
                              </h2>
                              <div className="text-gray-500 text-sm">
                                <span className="hidden sm:inline">
                                  {isSameDay(event.startDate, event.endDate)
                                    ? `${formatDate(
                                        event.startDate
                                      )}, ${formatTime(
                                        event.startDate
                                      )} - ${formatTime(event.endDate)}`
                                    : `${formatDate(
                                        event.startDate
                                      )}, ${formatTime(
                                        event.startDate
                                      )} - ${formatDate(
                                        event.endDate
                                      )}, ${formatTime(event.endDate)}`}
                                </span>
                                <span className="sm:hidden">
                                  {isSameDay(event.startDate, event.endDate)
                                    ? `${formatMobileDate(
                                        event.startDate
                                      )}, ${formatTime(
                                        event.startDate
                                      )} - ${formatTime(event.endDate)}`
                                    : `${formatMobileDate(
                                        event.startDate
                                      )}, ${formatTime(
                                        event.startDate
                                      )} - ${formatMobileDate(
                                        event.endDate
                                      )}, ${formatTime(event.endDate)}`}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              {event.locationType === "VENUE" &&
                                event.location && (
                                  <div className="flex items-center gap-2 font-medium text-gray-600">
                                    <MapPin className="size-3.5 flex-shrink-0" />
                                    <span className="text-sm truncate pr-10">
                                      {event.location.mainText}
                                      {event.location.secondaryText &&
                                        `, ${event.location.secondaryText}`}
                                      {event.location
                                        .locationAdditionalDetails &&
                                        `, ${event.location.locationAdditionalDetails}`}
                                    </span>
                                  </div>
                                )}
                              {event.locationType === "ONLINE" && (
                                <div className="flex items-center gap-2 font-medium text-gray-600">
                                  <PresentationIcon className="size-3.5 flex-shrink-0" />
                                  <span className="text-sm truncate pr-10">
                                    {event.meetingLink
                                      ? "Online Meeting"
                                      : "Online"}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-gray-600">
                                <Users className="size-3.5 flex-shrink-0" />
                                <span className="text-sm">
                                  {event.approvedAttendeesCount}{" "}
                                  {event.approvedAttendeesCount === 1
                                    ? "attendee"
                                    : "attendees"}
                                </span>
                              </div>
                            </div>
                          </Link>

                          {/* Desktop buttons */}
                          <div className="hidden sm:flex items-center gap-3 pt-1 pb-1">
                            {event.userRole && (
                              <Link href={`/e/${event.eventId}/settings`}>
                                <Button variant="outline" size="sm">
                                  <SettingsIcon className="size-3" />
                                  Event Settings
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Image */}
                        <Link
                          href={`/e/${event.eventId}`}
                          className="block flex-shrink-0"
                        >
                          <div className="relative size-[88px] sm:w-[180px] sm:h-[130px]">
                            <Image
                              src={
                                event.coverImage || "/event-placeholder-1.png"
                              }
                              alt={event.name}
                              fill
                              sizes="(max-width: 640px) 88px, 180px"
                              className="object-cover rounded-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/event-placeholder-1.png";
                              }}
                            />
                          </div>
                        </Link>
                      </div>

                      {/* Mobile buttons */}
                      <div className="flex sm:hidden items-center gap-3 w-full">
                        {event.userRole && (
                          <Link href={`/e/${event.eventId}/settings`}>
                            <Button size="sm" className="bg-black text-white">
                              <SettingsIcon className="size-3" />
                              Event Settings
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          {/* Going on Now */}
          {ongoingEvents.length > 0 && (
            // <div className="border-l-4 border-green-500 pl-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-semibold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                  Going on now
                </h3>
                <div className="relative mt-0.5">
                  <div
                    className={cn(
                      "absolute size-2.5 rounded-full bg-green-500/60",
                      "animate-[ping_2s_ease-in-out_infinite]"
                    )}
                  />
                  <div
                    className={cn(
                      "relative size-2.5 rounded-full bg-green-500",
                      "animate-[pulse_2s_ease-in-out_infinite]"
                    )}
                  />
                </div>
              </div>
              <div className="space-y-6 mt-6">
                {ongoingEvents.map((event) => (
                  <div
                    key={event.eventId}
                    className="bg-white rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start gap-3 shadow-md hover:scale-105 transition-all duration-300"
                  >
                    {/* Main content wrapper */}
                    <div className="flex flex-row justify-between w-full gap-3">
                      {/* Event details */}
                      <div className="space-y-1.5 flex-grow min-w-0">
                        <Link href={`/e/${event.eventId}`} className="block">
                          <div className="pb-2">
                            <h2 className="text-lg sm:text-xl font-semibold truncate">
                              {event.name}
                            </h2>
                            <div className="text-gray-500 text-sm">
                              <span>Now</span>
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            {event.locationType === "VENUE" &&
                              event.location && (
                                <div className="flex items-center gap-2 font-medium text-gray-600">
                                  <MapPin className="size-3.5 flex-shrink-0" />
                                  <span className="text-sm truncate pr-10">
                                    {event.location.mainText}
                                    {event.location.secondaryText &&
                                      `, ${event.location.secondaryText}`}
                                    {event.location.locationAdditionalDetails &&
                                      `, ${event.location.locationAdditionalDetails}`}
                                  </span>
                                </div>
                              )}
                            {event.locationType === "ONLINE" && (
                              <div className="flex items-center gap-2 font-medium text-gray-600">
                                <PresentationIcon className="size-3.5 flex-shrink-0" />
                                <span className="text-sm truncate pr-10">
                                  {event.meetingLink
                                    ? "Online Meeting"
                                    : "Online"}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-600">
                              <Users className="size-3.5 flex-shrink-0" />
                              <span className="text-sm">
                                {event.approvedAttendeesCount}{" "}
                                {event.approvedAttendeesCount === 1
                                  ? "attendee"
                                  : "attendees"}
                              </span>
                            </div>
                          </div>
                        </Link>

                        {/* Desktop buttons */}
                        <div className="hidden sm:flex items-center gap-2 pt-1 pb-1">
                          {event.userRole && (
                            <>
                              {event.locationType === "VENUE" && (
                                <TooltipProvider delayDuration={150}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Link
                                        href={`/e/${event.eventId}/check-in`}
                                      >
                                        <Button
                                          size="sm"
                                          className="bg-black text-white"
                                        >
                                          <ScanLine className="size-3" />
                                        </Button>
                                      </Link>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Check-in Attendees
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              <Link href={`/e/${event.eventId}/settings`}>
                                <Button variant="outline" size="sm">
                                  <SettingsIcon className="size-3" />
                                  Event Settings
                                </Button>
                              </Link>
                            </>
                          )}

                          {event.locationType === "VENUE" && (
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                              disabled={!event.registration?.isApproved}
                              onClick={() => {
                                if (event.registration?.isApproved) {
                                  window.open(
                                    `/e/ticket/${event.registration.ticketId}`
                                  );
                                }
                              }}
                            >
                              <TicketIcon className="size-3" />
                              My Ticket
                            </Button>
                          )}

                          {event.locationType === "ONLINE" &&
                            event.meetingLink && (
                              <Button
                                size="sm"
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                                disabled={!event.registration?.isApproved}
                                onClick={() => {
                                  window.open(event.meetingLink as string);
                                }}
                              >
                                <PresentationIcon className="size-3" />
                                Join Meeting
                              </Button>
                            )}
                        </div>
                        {event.registration &&
                          !event.registration?.isApproved && (
                            <span className="hidden sm:block text-xs text-gray-500">
                              {event.locationType === "VENUE" &&
                                "You will receive your ticket when you have been approved by the organizers"}
                              {event.locationType === "ONLINE" &&
                                event.meetingLink &&
                                "You will receive a link to the meeting when you have been approved by the organizers"}
                            </span>
                          )}
                      </div>

                      {/* Image */}
                      <Link
                        href={`/e/${event.eventId}`}
                        className="block flex-shrink-0"
                      >
                        <div className="relative size-[88px] sm:w-[180px] sm:h-[130px]">
                          <Image
                            src={event.coverImage || "/event-placeholder-1.png"}
                            alt={event.name}
                            fill
                            sizes="(max-width: 640px) 88px, 180px"
                            className="object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/event-placeholder-1.png";
                            }}
                          />
                        </div>
                      </Link>
                    </div>

                    {/* Mobile buttons */}
                    <div className="flex sm:hidden items-center gap-1.5 w-full">
                      {event.userRole && (
                        <>
                          {event.locationType === "VENUE" && (
                            <Link href={`/e/${event.eventId}/check-in`}>
                              <Button size="sm" className="bg-black text-white">
                                <ScanLine className="size-3" />
                              </Button>
                            </Link>
                          )}
                          <Link href={`/e/${event.eventId}/settings`}>
                            <Button variant="outline" size="sm">
                              <SettingsIcon className="size-3" />
                              Event Settings
                            </Button>
                          </Link>
                        </>
                      )}
                      {event.locationType === "VENUE" && (
                        <Button
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                          disabled={!event.registration?.isApproved}
                          onClick={() => {
                            if (event.registration?.isApproved) {
                              window.open(
                                `/e/ticket/${event.registration.ticketId}`
                              );
                            }
                          }}
                        >
                          <TicketIcon className="size-3" />
                          My Ticket
                        </Button>
                      )}

                      {event.locationType === "ONLINE" && event.meetingLink && (
                        <Button
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                          disabled={!event.registration?.isApproved}
                          onClick={() => {
                            window.open(event.meetingLink as string);
                          }}
                        >
                          <PresentationIcon className="size-3" />
                          Join Meeting
                        </Button>
                      )}
                    </div>
                    {event.registration && !event.registration?.isApproved && (
                      <span className="sm:hidden text-xs text-gray-500">
                        {event.locationType === "VENUE" &&
                          "You will receive your ticket when you have been approved by the organizers"}
                        {event.locationType === "ONLINE" &&
                          event.meetingLink &&
                          "You will receive a link to the meeting when you have been approved by the organizers"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            // <div className="border-l-4 border-blue-500 pl-4">
            <div>
              <h3 className="pt-4 text-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Upcoming Events
              </h3>
              <div className="space-y-6 mt-6">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.eventId}
                    className="bg-white rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start gap-3 shadow-md hover:scale-105 transition-all duration-300"
                  >
                    {/* Main content wrapper */}
                    <div className="flex flex-row justify-between w-full gap-3">
                      {/* Event details */}
                      <div className="space-y-1.5 flex-grow min-w-0">
                        <Link href={`/e/${event.eventId}`} className="block">
                          <div className="pb-2">
                            <h2 className="text-lg sm:text-xl font-semibold truncate">
                              {event.name}
                            </h2>
                            <div className="text-gray-500 text-sm">
                              <span className="hidden sm:inline">
                                {isSameDay(event.startDate, event.endDate)
                                  ? `${formatDate(
                                      event.startDate
                                    )}, ${formatTime(
                                      event.startDate
                                    )} - ${formatTime(event.endDate)}`
                                  : `${formatDate(
                                      event.startDate
                                    )}, ${formatTime(
                                      event.startDate
                                    )} - ${formatDate(
                                      event.endDate
                                    )}, ${formatTime(event.endDate)}`}
                              </span>
                              <span className="sm:hidden">
                                {isSameDay(event.startDate, event.endDate)
                                  ? `${formatMobileDate(
                                      event.startDate
                                    )}, ${formatTime(
                                      event.startDate
                                    )} - ${formatTime(event.endDate)}`
                                  : `${formatMobileDate(
                                      event.startDate
                                    )}, ${formatTime(
                                      event.startDate
                                    )} - ${formatMobileDate(
                                      event.endDate
                                    )}, ${formatTime(event.endDate)}`}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            {event.locationType === "VENUE" &&
                              event.location && (
                                <div className="flex items-center gap-2 font-medium text-gray-600">
                                  <MapPin className="size-3.5 flex-shrink-0" />
                                  <span className="text-sm truncate pr-10">
                                    {event.location.mainText}
                                    {event.location.secondaryText &&
                                      `, ${event.location.secondaryText}`}
                                    {event.location.locationAdditionalDetails &&
                                      `, ${event.location.locationAdditionalDetails}`}
                                  </span>
                                </div>
                              )}
                            {event.locationType === "ONLINE" && (
                              <div className="flex items-center gap-2 font-medium text-gray-600">
                                <PresentationIcon className="size-3.5 flex-shrink-0" />
                                <span className="text-sm truncate pr-10">
                                  {event.meetingLink
                                    ? "Online Meeting"
                                    : "Online"}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-600">
                              <Users className="size-3.5 flex-shrink-0" />
                              <span className="text-sm">
                                {event.approvedAttendeesCount}{" "}
                                {event.approvedAttendeesCount === 1
                                  ? "attendee"
                                  : "attendees"}
                              </span>
                            </div>
                          </div>
                        </Link>

                        {/* Desktop buttons */}
                        <div className="hidden sm:flex items-center gap-3 pt-1 pb-1">
                          {event.userRole && (
                            <Link href={`/e/${event.eventId}/settings`}>
                              <Button variant="outline" size="sm">
                                <SettingsIcon className="size-3" />
                                Event Settings
                              </Button>
                            </Link>
                          )}

                          {event.locationType === "VENUE" && (
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                              disabled={!event.registration?.isApproved}
                              onClick={() => {
                                if (event.registration?.isApproved) {
                                  window.open(
                                    `/e/ticket/${event.registration.ticketId}`
                                  );
                                }
                              }}
                            >
                              <TicketIcon className="size-3" />
                              My Ticket
                            </Button>
                          )}

                          {event.locationType === "ONLINE" &&
                            event.meetingLink && (
                              <Button
                                size="sm"
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                                disabled={!event.registration?.isApproved}
                                onClick={() => {
                                  window.open(event.meetingLink as string);
                                }}
                              >
                                <PresentationIcon className="size-3" />
                                Join Meeting
                              </Button>
                            )}
                        </div>
                        {event.registration &&
                          !event.registration?.isApproved && (
                            <span className="hidden sm:block text-xs text-gray-500">
                              {event.locationType === "VENUE" &&
                                "You will receive your ticket when you have been approved by the organizers"}
                              {event.locationType === "ONLINE" &&
                                event.meetingLink &&
                                "You will receive a link to the meeting when you have been approved by the organizers"}
                            </span>
                          )}
                      </div>

                      {/* Image */}
                      <Link
                        href={`/e/${event.eventId}`}
                        className="block flex-shrink-0"
                      >
                        <div className="relative size-[88px] sm:w-[180px] sm:h-[130px]">
                          <Image
                            src={event.coverImage || "/event-placeholder-1.png"}
                            alt={event.name}
                            fill
                            sizes="(max-width: 640px) 88px, 180px"
                            className="object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/event-placeholder-1.png";
                            }}
                          />
                        </div>
                      </Link>
                    </div>

                    {/* Mobile buttons */}
                    <div className="flex sm:hidden items-center gap-3 w-full">
                      {event.userRole && (
                        <Link href={`/e/${event.eventId}/settings`}>
                          <Button variant="outline" size="sm">
                            <SettingsIcon className="size-3" />
                            Event Settings
                          </Button>
                        </Link>
                      )}
                      {event.locationType === "VENUE" && (
                        <Button
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                          disabled={!event.registration?.isApproved}
                          onClick={() => {
                            if (event.registration?.isApproved) {
                              window.open(
                                `/e/ticket/${event.registration.ticketId}`
                              );
                            }
                          }}
                        >
                          <TicketIcon className="size-3" />
                          My Ticket
                        </Button>
                      )}

                      {event.locationType === "ONLINE" && event.meetingLink && (
                        <Button
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                          disabled={!event.registration?.isApproved}
                          onClick={() => {
                            window.open(event.meetingLink as string);
                          }}
                        >
                          <PresentationIcon className="size-3" />
                          Join Meeting
                        </Button>
                      )}
                    </div>
                    {event.registration && !event.registration?.isApproved && (
                      <span className="sm:hidden text-xs text-gray-500">
                        {event.locationType === "VENUE" &&
                          "You will receive your ticket when you have been approved by the organizers"}
                        {event.locationType === "ONLINE" &&
                          event.meetingLink &&
                          "You will receive a link to the meeting when you have been approved by the organizers"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Events */}
          {completedEvents.length > 0 && (
            <div>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 pt-4"
              >
                <h3 className="text-2xl font-semibold bg-gradient-to-r from-gray-600 to-gray-400 bg-clip-text text-transparent">
                  Completed Events
                </h3>
                <ChevronDownIcon
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    showCompleted ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showCompleted && (
                <div className="space-y-6 mt-6">
                  {completedEvents.map((event) => (
                    <div
                      key={event.eventId}
                      className="bg-white rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start gap-3 shadow-md hover:scale-105 transition-all duration-300"
                    >
                      {/* Main content wrapper */}
                      <div className="flex flex-row justify-between w-full gap-3">
                        {/* Event details */}
                        <div className="space-y-1.5 flex-grow min-w-0">
                          <Link href={`/e/${event.eventId}`} className="block">
                            <div className="pb-2">
                              <h2 className="text-lg sm:text-xl font-semibold truncate">
                                {event.name}
                              </h2>
                              <div className="text-gray-500 text-sm">
                                <span className="hidden sm:inline">
                                  {isSameDay(event.startDate, event.endDate)
                                    ? `${formatDate(
                                        event.startDate
                                      )}, ${formatTime(
                                        event.startDate
                                      )} - ${formatTime(event.endDate)}`
                                    : `${formatDate(
                                        event.startDate
                                      )}, ${formatTime(
                                        event.startDate
                                      )} - ${formatDate(
                                        event.endDate
                                      )}, ${formatTime(event.endDate)}`}
                                </span>
                                <span className="sm:hidden">
                                  {isSameDay(event.startDate, event.endDate)
                                    ? `${formatMobileDate(
                                        event.startDate
                                      )}, ${formatTime(
                                        event.startDate
                                      )} - ${formatTime(event.endDate)}`
                                    : `${formatMobileDate(
                                        event.startDate
                                      )}, ${formatTime(
                                        event.startDate
                                      )} - ${formatMobileDate(
                                        event.endDate
                                      )}, ${formatTime(event.endDate)}`}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              {event.locationType === "VENUE" &&
                                event.location && (
                                  <div className="flex items-center gap-2 font-medium text-gray-600">
                                    <MapPin className="size-3.5 flex-shrink-0" />
                                    <span className="text-sm truncate pr-10">
                                      {event.location.mainText}
                                      {event.location.secondaryText &&
                                        `, ${event.location.secondaryText}`}
                                      {event.location
                                        .locationAdditionalDetails &&
                                        `, ${event.location.locationAdditionalDetails}`}
                                    </span>
                                  </div>
                                )}
                              {event.locationType === "ONLINE" && (
                                <div className="flex items-center gap-2 font-medium text-gray-600">
                                  <PresentationIcon className="size-3.5 flex-shrink-0" />
                                  <span className="text-sm truncate pr-10">
                                    {event.meetingLink
                                      ? "Online Meeting"
                                      : "Online"}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-gray-600">
                                <Users className="size-3.5 flex-shrink-0" />
                                <span className="text-sm">
                                  {event.approvedAttendeesCount}{" "}
                                  {event.approvedAttendeesCount === 1
                                    ? "attendee"
                                    : "attendees"}
                                </span>
                              </div>
                            </div>
                          </Link>

                          {/* Desktop buttons */}
                          <div className="hidden sm:flex items-center gap-3 pt-1 pb-1">
                            {event.userRole && (
                              <Link href={`/e/${event.eventId}/settings`}>
                                <Button variant="outline" size="sm">
                                  <SettingsIcon className="size-3" />
                                  Event Settings
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Image */}
                        <Link
                          href={`/e/${event.eventId}`}
                          className="block flex-shrink-0"
                        >
                          <div className="relative size-[88px] sm:w-[180px] sm:h-[130px]">
                            <Image
                              src={
                                event.coverImage || "/event-placeholder-1.png"
                              }
                              alt={event.name}
                              fill
                              sizes="(max-width: 640px) 88px, 180px"
                              className="object-cover rounded-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/event-placeholder-1.png";
                              }}
                            />
                          </div>
                        </Link>
                      </div>

                      {/* Mobile buttons */}
                      <div className="flex sm:hidden items-center gap-3 w-full">
                        {event.userRole && (
                          <Link href={`/e/${event.eventId}/settings`}>
                            <Button variant="outline" size="sm">
                              <SettingsIcon className="size-3" />
                              Event Settings
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
