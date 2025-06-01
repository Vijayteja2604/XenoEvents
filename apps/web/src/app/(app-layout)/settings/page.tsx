"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Mail,
  Phone,
  CircleAlert,
  UserIcon,
  Loader2,
  Camera,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
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
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/auth/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useEditAccount, useDeleteAccount } from "@/hooks/user/useUser";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { data: session, isLoading } = useUser();
  const [deleteInput, setDeleteInput] = useState("");
  const router = useRouter();

  const { editAccount } = useEditAccount();
  const { deleteAccount, isLoading: isDeleting } = useDeleteAccount();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [originalValues, setOriginalValues] = useState({
    fullName: "",
    phoneNumber: "",
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      const initialFullName = session.user.fullName || "";
      const initialPhone = session.user.phoneNumber || "";

      setFullName(initialFullName);
      setEmail(session.user.email || "");
      setPhoneNumber(initialPhone);

      setOriginalValues({
        fullName: initialFullName,
        phoneNumber: initialPhone,
      });
    }
  }, [session]);

  const formatJoinDate = (date?: Date | string) => {
    if (!date) return "";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return `Joined ${dateObj.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })}`;
    } catch {
      return "";
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount.mutateAsync();
      toast.success("Account Deleted", {
        description: "Your account has been successfully deleted",
      });
      router.push("/");
    } catch (error) {
      toast.error("Delete Failed", {
        description:
          error instanceof Error ? error.message : "Failed to delete account",
      });
    }
  };

  const validateName = (name: string) => {
    if (!name.trim()) {
      return "Full name is required";
    }
    if (name.length > 120) {
      return "Full name must be less than 120 characters";
    }
    return null;
  };

  const validatePhoneNumber = (phone: string) => {
    if (!phone) return null; // Phone is optional
    if (!/^\d+$/.test(phone)) {
      return "Phone number must contain only digits";
    }
    if (phone.length !== 10) {
      return "Phone number must be exactly 10 digits";
    }
    return null;
  };

  const hasChanges = () => {
    return (
      fullName !== originalValues.fullName ||
      phoneNumber !== originalValues.phoneNumber ||
      selectedImage !== null
    );
  };

  const handleSaveChanges = async () => {
    const nameError = validateName(fullName);
    const phoneError = validatePhoneNumber(phoneNumber);

    if (nameError) {
      toast.error("Validation Error", {
        description: nameError,
      });
      return;
    }

    if (phoneError) {
      toast.error("Validation Error", {
        description: phoneError,
      });
      return;
    }

    try {
      setIsSaving(true);

      let profilePictureUrl = session?.user.profilePicture;
      if (selectedImage) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("image", selectedImage);

        try {
          const { url } = await api.uploadProfilePicture(formData);
          profilePictureUrl = url;
        } catch (error) {
          console.error("Error uploading image:", error);
          toast.error("Failed to upload profile picture");
          return;
        } finally {
          setIsUploading(false);
        }
      }

      await editAccount.mutateAsync({
        fullName,
        phoneNumber: phoneNumber || null,
        profilePicture: profilePictureUrl,
      });

      setSelectedImage(null);
      setOriginalValues({
        fullName,
        phoneNumber: phoneNumber || "",
      });

      toast.success("Profile Updated", {
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error("Failed to save changes:", error);
      toast.error("Update Failed", {
        description: "Failed to update profile. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setPhoneNumber(value);
    }
  };

  const validateProfileImage = (file: File) => {
    // Check file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload a PNG, JPG, or WebP file.");
      return false;
    }

    // Check file size (2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      toast.error("File is too large. Maximum size is 2MB.");
      return false;
    }

    return true;
  };

  const handleImageSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (validateProfileImage(file)) {
          setSelectedImage(file);
          const previewUrl = URL.createObjectURL(file);
          setImagePreview(previewUrl);
        }
      }
    },
    []
  );

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Account Settings
        </h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Manage your account preferences and settings
        </p>
      </div>

      <Card className="shadow-none border-none">
        <CardHeader>
          <CardTitle className="text-xl tracking-tight font-semibold">
            Your Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <label
                  htmlFor="profile-picture"
                  className="cursor-pointer block relative group"
                >
                  <Avatar className="h-32 w-32 border-4 border-background">
                    <AvatarImage
                      src={
                        imagePreview ||
                        (session?.user.profilePicture as string)
                      }
                      alt="Profile picture"
                      className="rounded-full aspect-square object-cover"
                      draggable={false}
                    />
                    <AvatarFallback className="text-3xl">
                      {session?.user.fullName ? (
                        session.user.fullName.split(" ").length > 1
                          ? `${session.user.fullName.split(" ")[0][0]}${session.user.fullName.split(" ")[1][0]}`
                          : session.user.fullName[0]
                      ) : ""}
                    </AvatarFallback>
                  </Avatar>

                  <div className="absolute inset-1 rounded-full bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </div>
                </label>
                <input
                  type="file"
                  id="profile-picture"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={isUploading}
                />
              </div>
              <div className="text-center">
                <Badge variant="secondary">
                  {formatJoinDate(session?.user.createdAt)}
                </Badge>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Full Name
                </Label>
                {isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Input
                    id="fullName"
                    type="string"
                    className="placeholder:text-sm"
                    placeholder="Enter your full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                {isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Input
                    id="email"
                    type="email"
                    className="placeholder:text-sm"
                    placeholder="Enter your email"
                    value={email}
                    disabled
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                {isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <div className="space-y-2">
                    <div className="flex rounded-lg">
                      <span className="inline-flex items-center rounded-s-lg border border-input px-2.5 text-sm text-muted-foreground bg-gray-50">
                        +91
                      </span>
                      <Input
                        id="phone"
                        type="tel"
                        className="-ms-px rounded-s-none shadow-none placeholder:text-sm"
                        placeholder="Enter your phone number"
                        value={phoneNumber}
                        onChange={handlePhoneNumberChange}
                        maxLength={10}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  variant="xeno"
                  className="w-full sm:w-fit"
                  disabled={isLoading || isSaving || !hasChanges()}
                  onClick={handleSaveChanges}
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none border-none">
        <CardContent className="p-6">
          <h3 className="text-xl tracking-tight font-semibold">
            Delete Account
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          <Separator className="my-4" />

          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-[34px]" variant="destructive">
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xs sm:max-w-sm rounded-xl bg-[#F9F9F8] [&>button]:hidden">
              <div className="flex flex-col items-center gap-2">
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-full border border-red-200 bg-red-50"
                  aria-hidden="true"
                >
                  <CircleAlert
                    className="text-destructive"
                    size={16}
                    strokeWidth={2}
                  />
                </div>
                <DialogHeader>
                  <DialogTitle className="sm:text-center">
                    Delete Account
                  </DialogTitle>
                  <DialogDescription className="sm:text-center">
                    This action cannot be undone. To confirm, please type{" "}
                    <span className="font-medium text-foreground">delete</span>{" "}
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
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                  />
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
                    disabled={deleteInput !== "delete"}
                    onClick={handleDeleteAccount}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting
                      </>
                    ) : (
                      "Delete Account"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
