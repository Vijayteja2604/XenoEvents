"use client";

import { useState, useRef, useEffect } from "react";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthActions, useUser } from "@/hooks/auth/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface NavLink {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
}

interface HeaderUserProps {
  navLinks: NavLink[];
}

const UserAvatar = ({
  profilePicture,
  name,
  size = "default",
}: {
  profilePicture?: string | null;
  name?: string | null;
  size?: "default" | "large";
}) => {
  const className = size === "large" ? "h-10 w-10" : "h-8 w-8 sm:h-9 sm:w-9";

  return (
    <Avatar className={className}>
      <AvatarImage src={profilePicture as string} alt={`${name}'s avatar`} />
      <AvatarFallback className="bg-blue-500 text-white text-xs">
        {name ? (
          name.split(" ").length > 1
            ? `${name.split(" ")[0][0]}${name.split(" ")[1][0]}`
            : name[0]
        ) : ""}
      </AvatarFallback>
    </Avatar>
  );
};

export default function HeaderUser({ navLinks }: HeaderUserProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Get user data and sign out mutation
  const { data: userData, isLoading } = useUser();
  const { signOut } = useAuthActions();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut.mutateAsync();
      toast.success("Signed out successfully");
      router.push("/");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const menuItems = [
    {
      label: "Settings",
      onClick: () => router.push("/settings"),
    },
  ];

  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center focus:outline-none"
      >
        <UserAvatar
          profilePicture={userData?.user.profilePicture}
          name={userData?.user.fullName}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 sm:w-72 rounded-lg shadow-lg bg-white ring-1 ring-black/5">
          {/* Profile Section */}
          <div className="p-3 sm:p-4 border-b border-gray-100">
            <div className="flex items-center gap-3 sm:gap-4">
              <UserAvatar
                profilePicture={userData?.user.profilePicture}
                name={userData?.user.fullName}
                size="large"
              />
              <div className="flex-1 truncate">
                <h3 className="font-medium text-sm sm:text-base truncate">
                  {userData?.user.fullName}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {userData?.user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Links */}
          <div className="sm:hidden border-b border-gray-100">
            <div className="grid grid-cols-3 gap-2 p-2">
              {navLinks.map(({ href, icon: Icon, label, isActive }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center justify-center rounded-md p-1 text-center transition-colors hover:bg-gray-100 ${
                    isActive ? "text-blue-500" : "text-black"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-4 w-4 mb-0.5" />
                  <span className="text-xs w-full">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1" role="menu">
            {menuItems.map((item, index) => (
              <div key={index} className="px-1">
                <button
                  onClick={item.onClick}
                  className="w-full flex items-center px-2 py-1.5 text-xs sm:text-sm hover:bg-gray-100 rounded-md"
                  role="menuitem"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                </button>
              </div>
            ))}

            <div className="px-1">
              <button
                onClick={handleSignOut}
                disabled={signOut.isPending}
                className="w-full flex items-center px-2 py-1.5 text-xs sm:text-sm hover:bg-gray-100 rounded-md disabled:opacity-50"
                role="menuitem"
              >
                <div>
                  <span className="text-muted-foreground">
                    {signOut.isPending ? "Signing out..." : "Logout"}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
