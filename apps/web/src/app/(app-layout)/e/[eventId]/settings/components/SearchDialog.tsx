import { useState, useCallback, useEffect } from "react";
import { debounce } from "lodash";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SearchUser {
  id: string;
  fullName: string | null;
  email: string;
  profilePicture: string | null;
}

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: SearchUser) => void;
  existingTeamIds: string[];
  heading?: string;
  description?: string;
}

export default function SearchDialog({
  isOpen,
  onClose,
  onSelectUser,
  existingTeamIds,
  heading = "Add Admin",
  description = "Search for a user by email address to add them as an admin."
}: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchUsers = useCallback(
    (email: string) => {
      if (!email || !email.includes("@")) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);

      const debouncedSearch = debounce(async () => {
        try {
          const users = await api.searchUsers(email);
          if (Array.isArray(users)) {
            const filteredUsers = users.filter(
              (user) => !existingTeamIds.includes(user.id)
            );
            setSearchResults(filteredUsers);
          }
        } catch (error) {
          console.error("Search error:", error);
          toast.error("Failed to search users");
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);

      debouncedSearch();

      return () => {
        debouncedSearch.cancel();
      };
    },
    [existingTeamIds]
  );

  useEffect(() => {
    const cleanup = searchUsers(searchQuery);
    return () => cleanup?.();
  }, [searchQuery, searchUsers]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs sm:max-w-md rounded-xl bg-[#F9F9F8]">
        <DialogHeader className="text-center">
          <DialogTitle>{heading}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            className="placeholder:text-sm"
            placeholder="Search by email address..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {isSearching ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                  onClick={() => {
                    onSelectUser(user);
                    onClose();
                  }}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user.profilePicture as string}
                    />
                    <AvatarFallback className="text-xs">
                      {user.fullName ? (
                        user.fullName.split(" ").length > 1
                          ? `${user.fullName.split(" ")[0][0]}${user.fullName.split(" ")[1][0]}`
                          : user.fullName[0]
                      ) : ""}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.fullName || "No name"}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-sm text-gray-500">
                {searchQuery.includes("@")
                  ? "No users found"
                  : "Enter an email address to search"}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
