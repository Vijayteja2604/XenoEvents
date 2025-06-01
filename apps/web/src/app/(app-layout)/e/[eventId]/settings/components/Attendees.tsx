"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  SearchIcon,
  ListFilterIcon,
  LogInIcon,
  UserMinusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UserIcon,
  CalendarIcon,
  DownloadIcon,
  Loader2Icon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XIcon,
  PlusIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { utils as xlsxUtils, writeFile as xlsxWriteFile } from "xlsx";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  TableOptions,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { useEventAttendees, useGetEvent, useApproveEventAttendees, useRemoveEventAttendees, useAddEventAttendee } from "@/hooks/event/useEvent";
import { useParams } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import SearchDialog from "./SearchDialog";

interface TableMeta {
  requiresApproval: boolean;
  handleApproval: (attendee: Attendee) => void;
  handleBulkApprovalDialog: (attendees: Attendee[]) => void;
}

interface Attendee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  imageUrl: string | null;
  dateAdded: string;
  checkInTime: string | null;
  isApproved: boolean;
}

type SortDirection = "asc" | "desc";
type SortBy = "name" | "dateRegistered" | "dateCheckedIn" | "approval" | null;

interface AttendeeMenuProps {
  attendee: Attendee;
  setSelectedAttendee: (attendee: Attendee) => void;
  setShowRemoveDialog: (show: boolean) => void;
  setShowApprovalDialog: (show: boolean) => void;
  isApproved: boolean;
  requiresApproval?: boolean;
}

interface SearchUser {
  id: string;
  fullName: string | null;
  email: string;
  profilePicture: string | null;
}

const formatDateTime = (dateString: string, isMobile: boolean = false) => {
  const date = new Date(dateString);
  return {
    formatted: isMobile ? 
      `${new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date)} on ${new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(date)}` :
      new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date),
    timestamp: date.getTime()
  };
};

const AttendeeMenu = ({
  attendee,
  setSelectedAttendee,
  setShowRemoveDialog,
  setShowApprovalDialog,
  isApproved,
  requiresApproval = false,
}: AttendeeMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem
        onClick={() => {
          setSelectedAttendee(attendee);
          setShowRemoveDialog(true);
        }}
      >
        <UserMinusIcon className="h-4 w-4" />
        Remove attendee
      </DropdownMenuItem>
      {requiresApproval && !isApproved && (
        <DropdownMenuItem
          onClick={() => {
            setSelectedAttendee(attendee);
            setShowApprovalDialog(true);
          }}
        >
          <LogInIcon className="h-4 w-4" />
          Approve attendee
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);

const createColumns = (
  setSelectedAttendee: (attendee: Attendee) => void,
  setShowRemoveDialog: (show: boolean) => void,
  setShowApprovalDialog: (show: boolean) => void,
  isVenueEvent: boolean
): ColumnDef<Attendee>[] => {
  const baseColumns: ColumnDef<Attendee>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);
          }}
          aria-label="Select all"
          className="mr-6"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => {
            row.toggleSelected(!!value);
          }}
          aria-label="Select row"
          className="mr-6"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Attendee",
      cell: ({ row }) => {
        const attendee = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                className="rounded-full aspect-square object-cover"
                src={attendee.imageUrl as string}
              />
              <AvatarFallback className="text-xs">
                {attendee.name.split(" ").length > 1
                  ? `${attendee.name.split(" ")[0][0]}${attendee.name.split(" ")[1][0]}`
                  : attendee.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{attendee.name}</span>
              <span className="text-sm text-gray-500">{attendee.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone || "N/A",
    },
    {
      id: "approval",
      header: ({ table }) => {
        const meta = table.options.meta as TableMeta;
        if (!meta.requiresApproval) return null;

        return (
          <div className="flex justify-center w-[60px] mr-4">
            <span className="text-sm">Approval</span>
          </div>
        );
      },
      cell: ({ row, table }) => {
        const attendee = row.original;
        const meta = table.options.meta as TableMeta;
        if (!meta.requiresApproval) return null;
        return (
          <div className="flex justify-center w-[60px]">
            <Checkbox
              className="disabled:opacity-75 disabled:border-none"
              checked={attendee.isApproved}
              disabled={attendee.isApproved}
              onCheckedChange={() => meta.handleApproval(attendee)}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "dateAdded",
      header: "Date registered",
      cell: ({ row }) => formatDateTime(row.original.dateAdded, false).formatted,
    }
  ];

  if (isVenueEvent) {
    baseColumns.push({
      accessorKey: "checkInTime",
      header: "Check-in time",
      cell: ({ row }) => {
        if (!row.original.checkInTime) return "N/A";
        return formatDateTime(row.original.checkInTime, false).formatted;
      },
    });
  }

  const actionsColumn: ColumnDef<Attendee> = {
    id: "actions",
    cell: ({ row, table }) => {
      const meta = table.options.meta as TableMeta;
      return (
        <AttendeeMenu
          attendee={row.original}
          setSelectedAttendee={setSelectedAttendee}
          setShowRemoveDialog={setShowRemoveDialog}
          setShowApprovalDialog={setShowApprovalDialog}
          isApproved={row.original.isApproved}
          requiresApproval={meta.requiresApproval}
        />
      );
    },
  };

  return [...baseColumns, actionsColumn];
};

interface RowSelectionState {
  [key: string]: boolean;
}

const MobileBulkActions = ({
  onBulkRemove,
  onBulkApprove,
  requiresApproval,
}: {
  onBulkRemove: () => void;
  onBulkApprove: () => void;
  requiresApproval: boolean;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <div className="h-10 w-10 flex items-center justify-center border rounded-md hover:bg-accent cursor-pointer">
        <Checkbox className="h-4 w-4" />
      </div>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      <DropdownMenuItem onClick={onBulkRemove}>
        <UserMinusIcon className="h-4 w-4 mr-2" />
        Remove all
      </DropdownMenuItem>
      {requiresApproval && (
        <DropdownMenuItem onClick={onBulkApprove}>
          <LogInIcon className="h-4 w-4 mr-2" />
          Approve all
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);

export default function Attendees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const params = useParams();
  const eventId = params.eventId as string;
  const { attendees: fetchedAttendees, requiresApproval, isLoading, error } = useEventAttendees(eventId);
  const { getEvent } = useGetEvent(params.eventId as string);
  const { data: event } = getEvent;
  const isVenueEvent = event?.locationType === "VENUE";
  const { approveAttendees, isApproving } = useApproveEventAttendees(eventId);
  const { removeAttendees, isRemoving } = useRemoveEventAttendees(eventId);
  const { addAttendee, isAdding } = useAddEventAttendee(eventId);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [showBulkApprovalDialog, setShowBulkApprovalDialog] = useState(false);
  const [attendeesToApprove, setAttendeesToApprove] = useState<Attendee[]>([]);
  const [showBulkRemoveDialog, setShowBulkRemoveDialog] = useState(false);
  const [attendeesToRemove, setAttendeesToRemove] = useState<Attendee[]>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [userToAdd, setUserToAdd] = useState<SearchUser | null>(null);

  const attendees = useMemo(() => 
    fetchedAttendees?.map(a => ({
      ...a,
      phone: a.phone || null,
      imageUrl: a.imageUrl || null,
      checkInTime: a.checkInTime || null,
    })) || []
  , [fetchedAttendees]);

  const handleApproval = (attendee: Attendee) => {
    if (!attendee.isApproved) {
      setSelectedAttendee(attendee);
      setShowApprovalDialog(true);
    }
  };

  const handleBulkApprovalDialog = (attendees: Attendee[]) => {
    const unapprovedAttendees = attendees.filter((a) => !a.isApproved);
    setAttendeesToApprove(unapprovedAttendees);
    setShowBulkApprovalDialog(true);
  };

  const confirmApproval = async () => {
    if (selectedAttendee) {
      try {
        await approveAttendees([selectedAttendee.id]);
        setShowApprovalDialog(false);
        setSelectedAttendee(null);
      } catch (error) {
        console.error("Error approving attendee:", error);
      }
    }
  };

  const confirmBulkApproval = async () => {
    try {
      await approveAttendees(attendeesToApprove.map(a => a.id));
      setShowBulkApprovalDialog(false);
      setAttendeesToApprove([]);
      setRowSelection({});
    } catch (error) {
      console.error("Error approving attendees:", error);
    }
  };

  const handleBulkRemove = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const selectedAttendees = selectedRows.map((row) => row.original);

    if (selectedAttendees.length > 0) {
      setAttendeesToRemove(selectedAttendees);
      setShowBulkRemoveDialog(true);
    }
  };

  const confirmBulkRemove = async () => {
    try {
      await removeAttendees(attendeesToRemove.map(a => a.id));
      setShowBulkRemoveDialog(false);
      setAttendeesToRemove([]);
      setRowSelection({});
      toast.success("Attendees removed successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove attendees");
    }
  };

  const columns = createColumns(
    setSelectedAttendee,
    setShowRemoveDialog,
    setShowApprovalDialog,
    isVenueEvent
  );

  const filteredAndSortedAttendees = useMemo(() => {
    let filtered = [...attendees];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        attendee =>
          attendee.name.toLowerCase().includes(query) ||
          attendee.email.toLowerCase().includes(query) ||
          (attendee.phone && attendee.phone.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case "name":
            comparison = a.name.localeCompare(b.name);
            break;
          case "dateRegistered":
            comparison = formatDateTime(a.dateAdded).timestamp - formatDateTime(b.dateAdded).timestamp;
            break;
          case "dateCheckedIn":
            if (!a.checkInTime && !b.checkInTime) comparison = 0;
            else if (!a.checkInTime) comparison = 1;
            else if (!b.checkInTime) comparison = -1;
            else {
              comparison = formatDateTime(a.checkInTime).timestamp - formatDateTime(b.checkInTime).timestamp;
            }
            break;
          case "approval":
            comparison = Number(a.isApproved) - Number(b.isApproved);
            break;
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [attendees, searchQuery, sortBy, sortDirection]);

  const tableConfig = useMemo<TableOptions<Attendee>>(() => ({
    data: filteredAndSortedAttendees,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    meta: {
      requiresApproval,
      handleApproval,
      handleBulkApprovalDialog,
    } as TableMeta,
  }), [filteredAndSortedAttendees, columns, sorting, rowSelection, requiresApproval]);

  const table = useReactTable(tableConfig);

  const handleRemoveAttendee = async () => {
    if (!selectedAttendee) return;
    try {
      await removeAttendees([selectedAttendee.id]);
      setShowRemoveDialog(false);
      setSelectedAttendee(null);
      toast.success("Attendee removed successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove attendee");
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAddAttendee = async (user: SearchUser) => {
    setUserToAdd(user);
    setShowAddDialog(true);
    setIsSearchOpen(false);
  };

  const confirmAddAttendee = async () => {
    if (!userToAdd) return;
    try {
      await addAttendee({ userId: userToAdd.id });
      setShowAddDialog(false);
      setUserToAdd(null);
      toast.success("Attendee added successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add attendee");
    }
  };

  // Error handling
  if (!eventId) {
    return (
      <div className="flex items-center gap-3 justify-center h-[560px] bg-white rounded-xl">
        <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />
        <p className="text-muted-foreground">Unable to load attendees: Invalid event ID</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 justify-center h-[560px] bg-white rounded-xl">
        <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />
        <p className="text-muted-foreground">Error loading attendees</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 h-[560px] bg-white rounded-xl">
        <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading attendees</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl  px-2 sm:px-4 flex flex-col h-[600px]">
        <div className="p-4 sm:p-6 pb-0">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between sm:hidden">
              <h2 className="text-xl font-semibold tracking-tighter">
                Total attendees:
                <span className="text-muted-foreground ml-2">
                  {attendees.length}
                </span>
                {requiresApproval && (
                  <div className="text-sm font-normal mt-1 tracking-tight text-muted-foreground">
                    Approved attendees:
                    <span className="ml-1">
                      {attendees.filter((a) => a.isApproved).length}
                    </span>
                  </div>
                )}
              </h2>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="hidden sm:flex flex-col gap-1">
                <h2 className="text-xl font-semibold tracking-tighter">
                  Total attendees:
                  <span className="text-muted-foreground ml-2">
                    {attendees.length}
                  </span>
                </h2>
                {requiresApproval && (
                  <h3 className="text-sm tracking-tight text-muted-foreground">
                    Approved attendees:
                    <span className="ml-1">
                      {attendees.filter((a) => a.isApproved).length}
                    </span>
                  </h3>
                )}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:space-x-3">
                <div className="relative w-full sm:w-[200px]">
                  <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-8 placeholder:text-xs sm:placeholder:text-sm"
                    placeholder="Search people..."
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                      onClick={() => setSearchQuery("")}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-end sm:justify-start w-full sm:w-auto pb-4 sm:pb-0 gap-2">
                  <div className="sm:hidden">
                    <MobileBulkActions
                      onBulkRemove={() => {
                        setAttendeesToRemove(attendees);
                        setShowBulkRemoveDialog(true);
                      }}
                      onBulkApprove={() => {
                        const unapprovedAttendees = attendees.filter(
                          (a) => !a.isApproved
                        );
                        setAttendeesToApprove(unapprovedAttendees);
                        setShowBulkApprovalDialog(true);
                      }}
                      requiresApproval={requiresApproval}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-1/3 sm:w-auto">
                        <ListFilterIcon className="h-4 w-4" />
                        Filters
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[180px]">
                      <DropdownMenuItem
                        className="text-xs font-medium"
                        onClick={() => {
                          if (sortBy === "name") {
                            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                          } else {
                            setSortBy("name");
                            setSortDirection("asc");
                          }
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span>By name</span>
                          </div>
                          {sortBy === "name" && (
                            sortDirection === "asc" ? (
                              <ArrowUpIcon className="h-4 w-4 ml-2" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4 ml-2" />
                            )
                          )}
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-xs font-medium"
                        onClick={() => {
                          if (sortBy === "dateRegistered") {
                            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                          } else {
                            setSortBy("dateRegistered");
                            setSortDirection("asc");
                          }
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            <span>By date registered</span>
                          </div>
                          {sortBy === "dateRegistered" && (
                            sortDirection === "asc" ? (
                              <ArrowUpIcon className="h-4 w-4 ml-2" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4 ml-2" />
                            )
                          )}
                        </div>
                      </DropdownMenuItem>
                      {isVenueEvent && (
                        <DropdownMenuItem
                          className="text-xs font-medium"
                          onClick={() => {
                            if (sortBy === "dateCheckedIn") {
                              setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                            } else {
                              setSortBy("dateCheckedIn");
                              setSortDirection("asc");
                            }
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <LogInIcon className="h-4 w-4" />
                              <span>By date checked in</span>
                            </div>
                            {sortBy === "dateCheckedIn" && (
                              sortDirection === "asc" ? (
                                <ArrowUpIcon className="h-4 w-4 ml-2" />
                              ) : (
                                <ArrowDownIcon className="h-4 w-4 ml-2" />
                              )
                            )}
                          </div>
                        </DropdownMenuItem>
                      )}
                      {requiresApproval && (
                        <DropdownMenuItem
                          className="text-xs font-medium"
                          onClick={() => {
                            if (sortBy === "approval") {
                              setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                            } else {
                              setSortBy("approval");
                              setSortDirection("asc");
                            }
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <CheckCircleIcon className="h-4 w-4" />
                              <span>By approval status</span>
                            </div>
                            {sortBy === "approval" && (
                              sortDirection === "asc" ? (
                                <ArrowUpIcon className="h-4 w-4 ml-2" />
                              ) : (
                                <ArrowDownIcon className="h-4 w-4 ml-2" />
                              )
                            )}
                          </div>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    className="w-1/3 sm:w-auto bg-blue-500 hover:bg-blue-600"
                    onClick={() => {
                      const worksheet = xlsxUtils.json_to_sheet(
                        attendees.map((a) => ({
                          Name: a.name,
                          Email: a.email,
                          Phone: a.phone ? `+91 ${a.phone}` : "N/A",
                          "Date Registered": formatDateTime(a.dateAdded, false).formatted,
                          ...(isVenueEvent && { 
                            "Check In Time": a.checkInTime ? formatDateTime(a.checkInTime, false).formatted : "N/A" 
                          }),
                        }))
                      );
                      const workbook = xlsxUtils.book_new();
                      xlsxUtils.book_append_sheet(
                        workbook,
                        worksheet,
                        "Attendees"
                      );
                      xlsxWriteFile(
                        workbook,
                        `${event?.name} attendees list.xlsx`
                      );
                    }}
                  >
                    <DownloadIcon className="size-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                  <Button
                    className="w-1/3 sm:w-auto"
                    onClick={() => setIsSearchOpen(true)}
                    disabled={isAdding}
                  >
                    {isAdding ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <>
                        <PlusIcon className="size-4" />
                        <span className="hidden sm:inline">Add</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden sm:block flex-1 overflow-hidden pb-4">
          {Object.values(rowSelection).filter(Boolean).length > 0 && (
            <div className="sticky top-0 z-10 bg-white border-b">
              <div className="flex items-center justify-between py-3 px-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm">
                    {Object.values(rowSelection).filter(Boolean).length} selected
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkRemove}
                    disabled={isRemoving}
                  >
                    {isRemoving ? (
                      <>
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                        Removing
                      </>
                    ) : (
                      <>
                        <UserMinusIcon className="h-4 w-4" />
                        Remove Selected
                      </>
                    )}
                  </Button>
                  {requiresApproval && (
                    <Button
                      size="sm"
                      onClick={() => {
                        const selectedRows = table.getSelectedRowModel().rows;
                        const selectedAttendees = selectedRows
                          .map((row) => row.original)
                          .filter((attendee) => !attendee.isApproved);
                        
                        if (selectedAttendees.length > 0) {
                          setAttendeesToApprove(selectedAttendees);
                          setShowBulkApprovalDialog(true);
                        } else {
                          toast.info("No unapproved attendees selected");
                        }
                      }}
                      className="text-xs bg-blue-500 hover:bg-blue-600"
                      disabled={isApproving}
                    >
                      {isApproving ? (
                        <>
                          <Loader2Icon className="h-4 w-4 animate-spin" />
                          Approving
                        </>
                      ) : (
                        <>
                          <LogInIcon className="h-4 w-4 mr-1" />
                          Approve Selected
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRowSelection({})}
                >
                  Clear selection
                </Button>
              </div>
            </div>
          )}
          <ScrollArea className="h-[450px]" type="always">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="py-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-4">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No attendees found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <ScrollArea className="sm:hidden flex-1 px-4 py-2 pb-6" type="always">
          <div className="grid gap-4">
            {filteredAndSortedAttendees.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-center text-muted-foreground text-sm">
                No attendees found.
              </div>
            ) : (
              filteredAndSortedAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex flex-col p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={attendee.imageUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {attendee.name.split(" ").length > 1
                            ? `${attendee.name.split(" ")[0][0]}${attendee.name.split(" ")[1][0]}`
                            : attendee.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{attendee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {attendee.email}
                        </div>
                      </div>
                    </div>
                    <AttendeeMenu
                      attendee={attendee}
                      setSelectedAttendee={setSelectedAttendee}
                      setShowRemoveDialog={setShowRemoveDialog}
                      setShowApprovalDialog={setShowApprovalDialog}
                      isApproved={attendee.isApproved}
                      requiresApproval={requiresApproval}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 text-sm">
                    {attendee.phone && (
                      <div className="text-muted-foreground">
                        Phone: +91 {attendee.phone}
                      </div>
                    )}
                    {requiresApproval && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        Approval Status:
                        <Badge
                          variant={
                            attendee.isApproved ? "xenoSecondary" : "secondary"
                          }
                          className="w-fit text-[10px]"
                        >
                          {attendee.isApproved ? "Approved" : "Not approved"}
                        </Badge>
                      </div>
                    )}
                    <div className="text-muted-foreground text-xs mt-1.5">
                      Registered: {formatDateTime(attendee.dateAdded, true).formatted}
                    </div>
                    {isVenueEvent && attendee.checkInTime && (
                      <div className="text-muted-foreground text-xs -mt-0.5">
                        Check-in: {formatDateTime(attendee.checkInTime, true).formatted}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent className="max-w-xs sm:max-w-md rounded-xl bg-[#F9F9F8] [&>button]:hidden">
          <DialogHeader className="text-center">
            <DialogTitle>Remove Attendee</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this attendee? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedAttendee && (
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedAttendee.imageUrl || undefined} />
                <AvatarFallback className="text-xs">
                  {selectedAttendee.name.split(" ").length > 1
                    ? `${selectedAttendee.name.split(" ")[0][0]}${selectedAttendee.name.split(" ")[1][0]}`
                    : selectedAttendee.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{selectedAttendee.name}</span>
                <span className="text-sm text-gray-500">
                  {selectedAttendee.email}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row items-center justify-end gap-x-3 sm:gap-x-1">
            <Button
              variant="outline"
              onClick={() => setShowRemoveDialog(false)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRemoveAttendee}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Removing
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-xs sm:max-w-md rounded-xl bg-[#F9F9F8] [&>button]:hidden">
          <DialogHeader className="text-center">
            <DialogTitle>Approve Attendee</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this attendee? You cannot
              unapprove an attendee after approving them
            </DialogDescription>
          </DialogHeader>

          {selectedAttendee && (
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedAttendee.imageUrl || undefined} />
                <AvatarFallback className="text-xs">
                  {selectedAttendee.name.split(" ").length > 1
                    ? `${selectedAttendee.name.split(" ")[0][0]}${selectedAttendee.name.split(" ")[1][0]}`
                    : selectedAttendee.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{selectedAttendee.name}</span>
                <span className="text-sm text-gray-500">
                  {selectedAttendee.email}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row items-center justify-end gap-x-3 sm:gap-x-1">
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmApproval}
              className="bg-blue-500 hover:bg-blue-600"
              disabled={isApproving}
            >
              {isApproving ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Approving
                </>
              ) : (
                "Approve"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add new Bulk Approval Dialog */}
      <Dialog
        open={showBulkApprovalDialog}
        onOpenChange={setShowBulkApprovalDialog}
      >
        <DialogContent className="max-w-xs sm:max-w-md rounded-xl bg-[#F9F9F8] [&>button]:hidden">
          <DialogHeader className="text-center">
            <DialogTitle>Approve All Attendees</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve {attendeesToApprove.length}{" "}
              attendee
              {attendeesToApprove.length === 1 ? "" : "s"}? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[200px]" type="always">
            <div className="pr-4">
              {attendeesToApprove.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center gap-3 p-4 border rounded-lg mb-2"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={attendee.imageUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {attendee.name.split(" ").length > 1
                        ? `${attendee.name.split(" ")[0][0]}${attendee.name.split(" ")[1][0]}`
                        : attendee.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{attendee.name}</span>
                    <span className="text-sm text-gray-500">
                      {attendee.email}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter className="flex flex-row items-center justify-end gap-x-3 sm:gap-x-1">
            <Button
              variant="outline"
              onClick={() => setShowBulkApprovalDialog(false)}
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmBulkApproval}
              className="bg-blue-500 hover:bg-blue-600"
              disabled={isApproving}
            >
              {isApproving ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Approving
                </>
              ) : (
                "Approve All"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bulk Remove Dialog */}
      <Dialog
        open={showBulkRemoveDialog}
        onOpenChange={setShowBulkRemoveDialog}
      >
        <DialogContent className="max-w-xs sm:max-w-md rounded-xl bg-[#F9F9F8] [&>button]:hidden">
          <DialogHeader className="text-center">
            <DialogTitle>Remove Attendees</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {attendeesToRemove.length}{" "}
              attendee
              {attendeesToRemove.length === 1 ? "" : "s"}? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[200px]" type="always">
            <div className="pr-4">
              {attendeesToRemove.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center gap-3 p-4 border rounded-lg mb-2"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={attendee.imageUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {attendee.name.split(" ").length > 1
                        ? `${attendee.name.split(" ")[0][0]}${attendee.name.split(" ")[1][0]}`
                        : attendee.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{attendee.name}</span>
                    <span className="text-sm text-gray-500">
                      {attendee.email}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter className="flex flex-row items-center justify-end gap-x-3 sm:gap-x-1">
            <Button
              variant="outline"
              onClick={() => setShowBulkRemoveDialog(false)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmBulkRemove}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Removing
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add SearchDialog */}
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectUser={handleAddAttendee}
        existingTeamIds={attendees.map(a => a.id)}
        heading="Add Attendee"
        description="Search for a user by email address to add them as an attendee."
      />

      {/* Add Attendee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-xs sm:max-w-md rounded-xl bg-[#F9F9F8] [&>button]:hidden">
          <DialogHeader className="text-center">
            <DialogTitle>Add Attendee</DialogTitle>
            <DialogDescription>
              Are you sure you want to add this attendee? {requiresApproval ? "They will need to be approved before they can attend the event." : "They will be automatically approved to attend the event."}
            </DialogDescription>
          </DialogHeader>

          {userToAdd && (
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userToAdd.profilePicture || undefined} />
                <AvatarFallback className="text-xs">
                  {userToAdd.fullName ? (
                    userToAdd.fullName.split(" ").length > 1
                      ? `${userToAdd.fullName.split(" ")[0][0]}${userToAdd.fullName.split(" ")[1][0]}`
                      : userToAdd.fullName[0]
                  ) : ""}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{userToAdd.fullName || "No name"}</span>
                <span className="text-sm text-gray-500">
                  {userToAdd.email}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row items-center justify-end gap-x-3 sm:gap-x-1">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setUserToAdd(null);
              }}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAddAttendee}
              className="bg-blue-500 hover:bg-blue-600"
              disabled={isAdding}
            >
              {isAdding ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Adding
                </>
              ) : (
                "Add"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
