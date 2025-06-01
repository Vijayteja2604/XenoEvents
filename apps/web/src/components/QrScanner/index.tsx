"use client";

import dynamic from "next/dynamic";
import { QrCode } from "lucide-react";
import type { IDetectedBarcode } from "@yudiel/react-qr-scanner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <QrCode className="h-8 w-8 animate-pulse text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Initializing camera...
          </p>
        </div>
      </div>
    ),
  }
);

interface QRScannerProps {
  onScan: (attendeeData: string) => void;
  resetTrigger?: number;
  users: Array<{
    id: string;
    name: string;
    email: string;
    imageUrl?: string | null;
  }>;
  isLoading?: boolean;
}

export function QRScanner({
  onScan,
  resetTrigger = 0,
  users,
  isLoading,
}: QRScannerProps) {
  const scannerKey = `scanner-${resetTrigger}`;
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
    if (!detectedCodes.length) return;
    onScan(detectedCodes[0].rawValue);
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const handleUserSelect = (user: (typeof users)[0]) => {
    onScan(user.id);
    setShowUserSearch(false);
  };

  return (
    <Card className="shadow-none border-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Check In Attendees</CardTitle>
          <CardDescription>Scan QR code or enter manually</CardDescription>
        </div>
        <Button
          variant="outline"
          className="p-2"
          onClick={() => setShowUserSearch(true)}
        >
          <UserPlus className="h-4 w-4" />
          Manual Entry
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full">
          <div className="relative h-[300px] sm:h-[400px] md:aspect-video md:h-auto w-full overflow-hidden">
            <Scanner
              key={scannerKey}
              onScan={handleScan}
              components={{
                audio: false,
                torch: false,
                finder: false,
              }}
              styles={{
                container: {
                  width: "100%",
                  height: "100%",
                  minHeight: "unset",
                  padding: 0,
                },
                video: {
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                },
              }}
            />
          </div>
        </div>
      </CardContent>

      <Dialog open={showUserSearch} onOpenChange={setShowUserSearch}>
        <DialogContent className="max-w-xs sm:max-w-sm rounded-xl bg-[#F9F9F8]">
          <DialogHeader className="text-center">
            <DialogTitle>Search Attendee</DialogTitle>
            <DialogDescription>
              Search for an attendee by name or email
            </DialogDescription>
          </DialogHeader>
          <Command className="rounded-lg border shadow-md">
            <CommandInput
              placeholder="Search attendees..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <ScrollArea className="h-[300px]">
              <CommandList className="shadow-none">
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="flex flex-col items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="text-sm text-muted-foreground">
                        Loading attendees...
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup>
                      {filteredUsers.map((user) => (
                        <CommandItem
                          key={user.id}
                          onSelect={() => handleUserSelect(user)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span>{user.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {user.email}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </ScrollArea>
          </Command>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
