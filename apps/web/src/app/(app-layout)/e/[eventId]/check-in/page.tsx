"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Users, SettingsIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";
import { toast } from "sonner";
import { QRScanner } from "@/components/QrScanner";
import {
  useCheckInAttendee,
  useEventCheckIns,
  useEventRole,
  useUncheckInAttendee,
} from "@/hooks/event/useEvent";
import { notFound, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useEventCounts } from "@/hooks/event/useEvent";
import { useEventAttendees } from "@/hooks/event/useEvent";

interface ScannedAttendee {
  name: string;
  email: string;
  ticketId: string;
  isCheckedIn?: boolean;
  checkInDate?: string;
}

const formatCheckInTime = (dateString: string) => {
  const time = new Date(dateString).toLocaleString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const date = new Date(dateString).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
  });

  return `${time}, ${date}`;
};

export default function CheckInPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const {
    checkInAttendee: mutateCheckIn,
    isCheckingIn,
    reset: resetCheckIn,
  } = useCheckInAttendee(eventId);

  const {
    uncheckInAttendee: mutateUncheckIn,
    isUncheckingIn,
    reset: resetUncheckIn,
  } = useUncheckInAttendee(eventId);

  const [isMounted, setIsMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [scannedAttendee, setScannedAttendee] =
    useState<ScannedAttendee | null>(null);
  const [scannerResetKey, setScannerResetKey] = useState(0);

  const {
    checkIns,
    isLoading: isLoadingCheckIns,
    refetch: refetchCheckIns,
  } = useEventCheckIns(eventId);

  const {
    eventName,
    totalAttendees,
    checkedInCount,
    isLoading: isLoadingCounts,
    locationType,
    refetch: refetchCounts,
  } = useEventCounts(eventId);

  const { attendees, isLoading: isLoadingAttendees } =
    useEventAttendees(eventId);

  const { role, isLoading: isLoadingRole } = useEventRole(eventId);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleScan = async (scannedData: string) => {
    try {
      // If it's a manual check-in (attendee ID)
      const selectedUser = attendees.find(a => a.id === scannedData);
      if (selectedUser) {
        try {
          // Get the attendee's ticket code
          const ticket = await api.getAttendeeTicket(eventId, selectedUser.id);

          if (!ticket.ticketCode) {
            toast.error("Invalid Ticket", {
              description: "This attendee doesn't have a valid ticket",
            });
            return;
          }

          // Check if user is already checked in
          const checkInRecord = checkIns.find(
            record => record.user.email === selectedUser.email
          );

          const attendeeData: ScannedAttendee = {
            name: selectedUser.name,
            email: selectedUser.email,
            ticketId: ticket.ticketCode, // Using the actual ticket code
            isCheckedIn: !!checkInRecord,
            checkInDate: checkInRecord?.checkInDate,
          };

          setScannedAttendee(attendeeData);
          setIsDialogOpen(true);
          return;
        } catch (err) {
          toast.error("Error", {
            description: err instanceof Error ? err.message : "Failed to get ticket information",
          });
          return;
        }
      }

      // If it's a QR code scan
      const data = await api.verifyTicket(scannedData);

      if (data.eventId !== eventId) {
        toast.error("Invalid Ticket", {
          description: "This ticket is for a different event",
        });
        return;
      }

      const attendeeData: ScannedAttendee = {
        name: data.user.fullName,
        email: data.user.email,
        ticketId: scannedData,
        isCheckedIn: data.isCheckedIn,
        checkInDate: data.checkInDate,
      };

      setScannedAttendee(attendeeData);
      setIsDialogOpen(true);
    } catch (err) {
      console.error("Error processing check-in:", err);

      // Handle specific error messages
      const errorMessage =
        err instanceof Error ? err.message : "Failed to process check-in";

      if (errorMessage.includes("Invalid ticket")) {
        toast.error("Invalid Ticket", {
          description: "This is not a valid ticket",
          className:
            "bg-rose-500 text-white border-0 outline-none shadow-none [&>div]:border-0 [&>div]:!outline-none [&>div]:!shadow-none",
        });
      } else {
        toast.error("Error", {
          description: errorMessage,
          className:
            "bg-rose-500 text-white border-0 outline-none shadow-none [&>div]:border-0 [&>div]:!outline-none [&>div]:!shadow-none",
        });
      }
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!scannedAttendee) return;

    try {
      if (scannedAttendee.isCheckedIn) {
        // Uncheck in
        const data = await mutateUncheckIn({
          ticketCode: scannedAttendee.ticketId,
        });
        toast.success("Uncheck-in successful", {
          description: `${data.user.fullName} has been unchecked in`,
        });
      } else {
        // Check in
        const data = await mutateCheckIn({
          ticketCode: scannedAttendee.ticketId,
        });
        toast.success("Check-in successful", {
          description: `${data.user.fullName} has been checked in`,
        });
      }

      setIsDialogOpen(false);
      await Promise.all([refetchCheckIns(), refetchCounts()]);
    } catch (err) {
      toast.error(
        scannedAttendee.isCheckedIn ? "Uncheck-in failed" : "Check-in failed",
        {
          description: err instanceof Error ? err.message : "Operation failed",
        }
      );
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setScannedAttendee(null);
      setScannerResetKey((prev) => prev + 1);
      resetCheckIn();
      resetUncheckIn();
    }
  };

  if (!isMounted || isLoadingRole) {
    return (
      <div className="space-y-8">
        {/* Skeleton Header */}
        <div>
          <div className="text-center space-y-1">
            <div className="h-12 sm:h-14 w-72 sm:w-96 bg-muted rounded mx-auto pb-4" />
            <div className="h-4 w-48 bg-muted rounded mx-auto mt-4 mb-6" />
          </div>
        </div>

        {/* Skeleton Stats Card and Settings Button */}
        <div className="flex justify-between items-center">
          <Card className="flex items-center gap-6 p-2 w-fit shadow-none border-none">
            <div className="h-8 w-40 flex items-center gap-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded" />
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="h-8 w-40 flex items-center gap-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded" />
            </div>
          </Card>

          {/* Skeleton Settings Button */}
          <div className="h-9 w-36 bg-muted rounded-full" />
        </div>

        {/* Skeleton Scanner Card */}
        <Card className="h-[400px] animate-pulse">
          <CardHeader className="pb-4">
            <div className="h-6 w-32 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded mt-2" />
          </CardHeader>
        </Card>

        {/* Skeleton History Card */}
        <Card className="h-[400px] animate-pulse">
          <CardHeader className="pb-4">
            <div className="h-6 w-32 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded mt-2" />
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (role !== "CREATOR" && role !== "ADMIN") {
    return notFound();
  }

  if (
    !isLoadingCounts &&
    (locationType === "ONLINE" || locationType === undefined)
  ) {
    return notFound();
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="text-center space-y-1">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            {isLoadingCounts ? (
              <div className="h-12 w-64 bg-muted rounded-lg mx-auto animate-pulse" />
            ) : (
              eventName
            )}
          </h1>
          <p className="text-muted-foreground">
            Check in attendees for your event
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Card className="w-full sm:w-auto flex items-center justify-center gap-3 p-3 sm:p-4 shadow-none border-none bg-blue-100/75">
            <div className="flex items-center gap-2">
              <div className="bg-blue-200/75 p-2 rounded-full">
                <CheckCircle2 className="text-blue-500 size-4 sm:size-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">
                  Checked In
                </span>
                {isLoadingCounts ? (
                  <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                ) : (
                  <strong className="text-base sm:text-lg">
                    {checkedInCount} / {totalAttendees}
                  </strong>
                )}
              </div>
            </div>
          </Card>

          <Card className="w-full sm:w-auto flex items-center justify-center gap-3 p-3 sm:p-4 shadow-none border-none bg-green-100">
            <div className="flex items-center gap-2">
              <div className="bg-green-200/75 p-2 rounded-full">
                <Users className="text-green-500 size-4 sm:size-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">
                  Total Attendees
                </span>
                {isLoadingCounts ? (
                  <div className="h-5 w-12 bg-muted rounded animate-pulse" />
                ) : (
                  <strong className="text-base sm:text-lg">
                    {totalAttendees}{" "}
                    {totalAttendees === 1 ? "person" : "people"}
                  </strong>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Settings Button */}
        <Link
          href={`/e/${eventId}/settings`}
          className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 rounded-lg px-4 py-2 font-medium text-sm tracking-tight flex items-center justify-center gap-2 text-white transition-colors border-none"
        >
          <SettingsIcon className="size-4" />
          <span>Event Settings</span>
        </Link>
      </div>

      {/* Scanner Section */}
      {isMounted && (
        <QRScanner
          onScan={handleScan}
          resetTrigger={scannerResetKey}
          users={attendees.filter(a => a.isApproved)}
          isLoading={isLoadingAttendees}
        />
      )}

      {/* History Section */}
      <Card className="h-[400px] flex flex-col shadow-none border-none">
        <CardHeader className="pb-4 space-y-0">
          <CardTitle>Check-in History</CardTitle>
          <CardDescription className="pt-1 text-sm">
            Recent check-in activity
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-1">
          <ScrollArea className="h-[300px] rounded-md" type="always">
            <Table>
              <TableHeader className="top-0 text-xs">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="bg-background sticky top-0 z-20">
                    Attendee
                  </TableHead>
                  <TableHead className="text-right bg-background sticky top-0 z-20 w-[150px] pr-6">
                    Time
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingCheckIns ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p>Loading check-ins...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : checkIns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="h-8 w-8" />
                        <p>No check-ins recorded yet</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  checkIns.map((record) => (
                    <TableRow
                      key={record.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="py-3 min-w-[100px] max-w-[200px]">
                        <div
                          className="font-medium truncate"
                          title={record.user.fullName}
                        >
                          {record.user.fullName}
                        </div>
                        <div
                          className="text-sm text-muted-foreground truncate"
                          title={record.user.email}
                        >
                          {record.user.email}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right text-muted-foreground w-[150px] shrink-0">
                        {formatCheckInTime(record.checkInDate)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-[90%] w-full sm:max-w-sm rounded-xl bg-[#F9F9F8] [&>button]:hidden p-4 sm:p-6">
          <DialogHeader className="space-y-2 sm:space-y-3">
            <DialogTitle className="text-center text-lg sm:text-xl">
              {scannedAttendee?.isCheckedIn
                ? "Attendee Already Checked In"
                : "Confirm Check-in"}
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground">
              {scannedAttendee?.isCheckedIn && scannedAttendee.checkInDate
                ? `This attendee was checked in at ${formatCheckInTime(
                    scannedAttendee.checkInDate
                  )}`
                : "Please verify the attendee before checking in"}
            </DialogDescription>
          </DialogHeader>

          {scannedAttendee && (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
              <div className="flex flex-col min-w-0 flex-1">
                <span
                  className="font-medium truncate"
                  title={scannedAttendee.name}
                >
                  {scannedAttendee.name}
                </span>
                <span
                  className="text-sm text-muted-foreground truncate"
                  title={scannedAttendee.email}
                >
                  {scannedAttendee.email}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row items-center justify-end gap-x-3 sm:gap-x-1">
            <Button
              variant="outline"
              onClick={() => handleDialogChange(false)}
              disabled={isCheckingIn || isUncheckingIn}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCheckIn}
              className={
                scannedAttendee?.isCheckedIn
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "bg-blue-500 hover:bg-blue-600"
              }
              disabled={isCheckingIn || isUncheckingIn}
            >
              {isCheckingIn || isUncheckingIn ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span className="truncate">
                    {scannedAttendee?.isCheckedIn
                      ? "Unchecking in"
                      : "Checking in"}
                  </span>
                </div>
              ) : scannedAttendee?.isCheckedIn ? (
                "Uncheck in"
              ) : (
                "Check in"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
