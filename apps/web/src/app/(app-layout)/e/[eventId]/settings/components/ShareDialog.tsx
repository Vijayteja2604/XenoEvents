import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { CheckSquareIcon, CopyIcon } from "lucide-react";

interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
}

export default function ShareDialog({
  isOpen,
  onOpenChange,
  shareUrl,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const cleanShareUrl =
    typeof window !== "undefined"
      ? window.location.href.replace("/settings", "")
      : shareUrl.replace("/settings", "");

  const displayUrl = cleanShareUrl.replace(/^https?:\/\//, "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const socialLinks = [
    {
      name: "Facebook",
      icon: <Image src="/Facebook.svg" alt="Facebook" width={30} height={30} />,
      color: "text-[#1877F2]",
      onClick: () =>
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            displayUrl
          )}`,
          "_blank"
        ),
    },
    {
      name: "Twitter",
      icon: <Image src="/TwitterX.svg" alt="Twitter" width={30} height={30} />,
      color: "text-[#1DA1F2]",
      onClick: () =>
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            displayUrl
          )}`,
          "_blank"
        ),
    },
    {
      name: "Instagram",
      icon: (
        <Image src="/Instagram.svg" alt="Instagram" width={30} height={30} />
      ),
      color: "text-[#E4405F]",
      onClick: () => {},
    },
    {
      name: "WhatsApp",
      icon: <Image src="/WhatsApp.svg" alt="WhatsApp" width={30} height={30} />,
      color: "text-[#25D366]",
      onClick: () =>
        window.open(
          `https://api.whatsapp.com/send?text=${encodeURIComponent(
            displayUrl
          )}`,
          "_blank"
        ),
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-sm rounded-xl bg-[#F9F9F8]">
        <DialogHeader className="text-center">
          <DialogTitle className="text-center">Share this link via</DialogTitle>
          <DialogDescription className="sr-only">
            Share this event via social media or copy the link
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-4">
            {socialLinks.map((link) => (
              <button
                key={link.name}
                onClick={link.onClick}
                className={`rounded-full p-3 hover:bg-gray-100 ${link.color}`}
                title={link.name}
              >
                {link.icon}
              </button>
            ))}
          </div>
          <div>
            <Separator className="mb-4" />
            <p className="text-xs text-gray-500 mb-1">or Copy Link</p>
            <div className="flex items-center gap-2">
              <Input
                className="h-8 bg-gray-50/90 text-sm shadow-none"
                value={displayUrl}
                readOnly
              />
              <Button
                className={`px-3 transition-all duration-300 ${
                  copied
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
                onClick={handleCopy}
              >
                <span className="sr-only">Copy</span>
                {copied ? (
                  <CheckSquareIcon className="h-4 w-4 text-white animate-scale-check" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
