import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CircleAlertIcon,
  UserPlusIcon,
  UserMinusIcon,
  InfoIcon,
  Loader2Icon,
} from "lucide-react";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import InfoDialog from "@/components/dialogs/InfoDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useEventTeam,
  useAddAdmin,
  useRemoveAdmin,
  useDeleteEvent,
} from "@/hooks/settings/useSettings";
import { toast } from "sonner";
import SearchDialog from "./SearchDialog";
import { useEventRole } from "@/hooks/event/useEvent";
import { ScrollArea } from "@/components/ui/scroll-area";

// Add this interface
interface SearchUser {
  id: string;
  fullName: string | null;
  email: string;
  profilePicture: string | null;
}

export default function More() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const { role } = useEventRole(eventId);
  const isCreator = role === "CREATOR";

  // Hooks
  const { eventTeam, isLoading } = useEventTeam(eventId);
  const { addAdmin, isAdding } = useAddAdmin(eventId);
  const { removeAdmin, isRemoving } = useRemoveAdmin(eventId);
  const { deleteEvent, isDeleting } = useDeleteEvent();

  const creator = eventTeam.find((member) => member.role === "creator");
  const admins = eventTeam.filter((member) => member.role === "admin");

  const confirmAddAdmin = async () => {
    if (selectedUser) {
      try {
        await addAdmin(selectedUser.id);
        toast.success("Admin added successfully");
        setShowAddDialog(false);
        setSelectedUser(null);
      } catch {
        toast.error("Failed to add admin");
      }
    }
  };

  const handleRemoveAdmin = async () => {
    if (selectedAdmin) {
      try {
        await removeAdmin(selectedAdmin);
        toast.success("Admin removed successfully");
        setShowRemoveDialog(false);
        setSelectedAdmin(null);
      } catch {
        toast.error("Failed to remove admin");
      }
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await deleteEvent(eventId);
      toast.success("Event deleted successfully");
      router.push("/events");
    } catch {
      toast.error("Failed to delete event");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pt-4">
        <div className="bg-white rounded-xl shadow-sm p-6 h-[300px] flex items-center justify-center">
          <Loader2Icon className="size-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-4 tracking-tight">
        Additional Settings
      </h2>
      <Separator />
      <div className="space-y-6 pt-4">
        <div>
          <div className="flex items-center justify-between pb-4 sm:pb-2">
            <div>
              <h3 className="text-xl tracking-tight font-semibold flex items-center gap-2">
                Event Team
                {isCreator && (
                  <button
                    onClick={() => setShowInfoDialog(true)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <InfoIcon className="h-4 w-4" />
                  </button>
                )}
              </h3>
            </div>

            {isCreator && (
              <>
                <Button
                  className="ml-4 h-[34px] bg-blue-500 hover:bg-blue-600"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <UserPlusIcon className="size-3 sm:size-4" />
                  <span className="text-xs sm:text-sm">Add Admin</span>
                </Button>

                <SearchDialog
                  isOpen={isSearchOpen}
                  onClose={() => setIsSearchOpen(false)}
                  onSelectUser={(user) => {
                    setSelectedUser(user);
                    setShowAddDialog(true);
                  }}
                  existingTeamIds={eventTeam.map((member) => member.id)}
                  heading="Add Admin"
                  description="Search for a user by email address to add them as an admin."
                />
              </>
            )}
          </div>
          <div className="mt-2" style={{ height: Math.min(eventTeam.length * 80, 300) }}>
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-4">
                {/* Creator */}
                {creator && (
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage
                          className="rounded-full aspect-square object-cover"
                          src={creator.image as string}
                        />
                        <AvatarFallback className="text-xs">
                          {creator.name ? (
                            creator.name.split(" ").length > 1 
                              ? `${creator.name.split(" ")[0][0]}${creator.name.split(" ")[1][0]}`
                              : creator.name[0]
                          ) : ""}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-4 mb-0.5">
                          <p className="font-medium truncate">{creator.name}</p>
                          <Badge variant="xeno" className="shrink-0">
                            Creator
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {creator.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admins */}
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={admin.image as string} />
                        <AvatarFallback className="text-xs">
                          {admin.name ? (
                            admin.name.split(" ").length > 1
                              ? `${admin.name.split(" ")[0][0]}${admin.name.split(" ")[1][0]}`
                              : admin.name[0]
                          ) : ""}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-4 mb-0.5">
                          <p className="font-medium truncate">{admin.name}</p>
                          <Badge variant="xenoSecondary" className="shrink-0">
                            Admin
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {admin.email}
                        </p>
                      </div>
                    </div>
                    {isCreator && (
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 shrink-0 ml-4"
                                onClick={() => {
                                  setSelectedAdmin(admin.id);
                                  setShowRemoveDialog(true);
                                }}
                              >
                                <UserMinusIcon className="h-4 w-4 font-extrabold text-rose-500" />
                              </Button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Remove admin</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  ))}
              </div>
            </ScrollArea>
          </div>

          <InfoDialog
            heading="About Admins"
            text="An admin can manage the event, including editing details and managing attendees, but cannot delete the event."
            isOpen={showInfoDialog}
            onOpenChange={setShowInfoDialog}
          />

          <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
            <DialogContent className="max-w-xs rounded-xl bg-[#F9F9F8] [&>button]:hidden">
              <div className="flex flex-col items-center gap-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-red-200 bg-red-50">
                  <UserMinusIcon
                    className="text-destructive"
                    size={16}
                    strokeWidth={2}
                  />
                </div>
                <DialogHeader>
                  <DialogTitle className="text-center">
                    Remove Admin
                  </DialogTitle>
                  <DialogDescription className="text-center">
                    Are you sure you want to remove this admin? They will no
                    longer be able to manage this event.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <DialogFooter className="flex flex-row sm:flex-row gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1"
                  onClick={handleRemoveAdmin}
                  disabled={isRemoving}
                >
                  {isRemoving ? (
                    <div className="flex items-center gap-2">
                      <Loader2Icon className="size-4 animate-spin" />
                      Removing
                    </div>
                  ) : (
                    "Remove Admin"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="max-w-xs rounded-xl bg-[#F9F9F8] [&>button]:hidden">
              <div className="flex flex-col items-center gap-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50">
                  <UserPlusIcon
                    className="text-blue-500"
                    size={16}
                    strokeWidth={2}
                  />
                </div>
                <DialogHeader>
                  <DialogTitle className="text-center">Add Admin</DialogTitle>
                  <DialogDescription className="text-center">
                    Are you sure you want to add {selectedUser?.fullName} as an
                    admin? They will be able to manage this event.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <DialogFooter className="flex flex-row sm:flex-row gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </DialogClose>

                <Button
                  variant="xeno"
                  type="button"
                  className="flex-1"
                  onClick={confirmAddAdmin}
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <div className="flex items-center gap-2">
                      <Loader2Icon className="size-4 animate-spin" />
                      Adding 
                    </div>
                  ) : (
                    "Add Admin"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {isCreator && (
            <>
              <Separator className="mt-6 mb-5" />
              <h3 className="text-xl tracking-tight font-semibold">
                Delete Event
              </h3>
              <p className="text-gray-600 sm:text-sm text-xs mt-1">
                Cancel and permanently delete this event. This operation cannot
                be undone.
              </p>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="mt-4 h-[34px]" variant="destructive">
                    Delete Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xs sm:max-w-sm rounded-xl bg-[#F9F9F8] [&>button]:hidden">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-red-200 bg-red-50"
                      aria-hidden="true"
                    >
                      <CircleAlertIcon
                        className="text-destructive"
                        size={16}
                        strokeWidth={2}
                      />
                    </div>
                    <DialogHeader>
                      <DialogTitle className="sm:text-center">
                        Delete Event
                      </DialogTitle>
                      <DialogDescription className="sm:text-center">
                        This action cannot be undone. To confirm, please type{" "}
                        <span className="font-medium text-foreground">
                          delete
                        </span>{" "}
                        below.
                      </DialogDescription>
                    </DialogHeader>
                  </div>

                  <form className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="confirm">Confirmation</Label>
                      <Input
                        className="sm:text-sm placeholder:text-sm"
                        id="confirm"
                        type="text"
                        placeholder="Type 'delete' to confirm"
                        value={confirmDelete}
                        onChange={(e) => setConfirmDelete(e.target.value)}
                      />
                    </div>
                    <DialogFooter className="flex flex-row sm:flex-row gap-2 sm:gap-0">
                      <DialogClose asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        disabled={confirmDelete !== "delete" || isDeleting}
                        type="button"
                        variant="destructive"
                        className="flex-1"
                        onClick={handleDeleteEvent}
                      >
                        {isDeleting ? (
                          <div className="flex items-center gap-2">
                            <Loader2Icon className="size-4 animate-spin" />
                            Deleting 
                          </div>
                        ) : (
                          "Delete Event"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
