/* eslint-disable @next/next/no-img-element */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import ImageUploadDialog from "./Dialogs/ImageUploadDialog";

interface CreateEventHeaderProps {
  eventName: string;
  onEventNameChange: (name: string) => void;
  coverImage?: { file: File; preview: string } | string;
  onCoverImageChange?: (
    image: { file: File; preview: string } | string
  ) => void;
}

export default function CreateEventHeader({
  eventName,
  onEventNameChange,
  coverImage = "/event-placeholder-1.png",
  onCoverImageChange = () => {},
}: CreateEventHeaderProps) {
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

  const getImageUrl = (image: typeof coverImage) => {
    if (typeof image === "string") return image;
    return image.preview;
  };

  return (
    <>
      <div className="space-y-4">
        <div className="relative aspect-video overflow-hidden rounded-xl">
          <img
            alt="Event preview"
            className="h-full w-full object-cover"
            src={getImageUrl(coverImage)}
            draggable={false}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.src = "/event-placeholder-1.png";
            }}
          />
          <Button
            className="absolute bottom-4 py-5 px-4 sm:px-6 right-4 text-sm font-semibold"
            size="sm"
            variant="secondary"
            onClick={() => setIsImageDialogOpen(true)}
          >
            Change Image
          </Button>
        </div>
        <div className="relative px-5">
          <div className="flex items-center gap-4">
            <Input
              className="h-auto flex-1 border-none bg-transparent px-0 !text-4xl font-semibold tracking-tight shadow-none hover:text-black/60 placeholder:text-black/25 hover:placeholder:text-black/30 dark:placeholder:text-white/30 sm:!text-5xl"
              placeholder="Event Name"
              value={eventName}
              onChange={(e) => onEventNameChange(e.target.value)}
              maxLength={120}
              autoFocus
            />
          </div>
        </div>
      </div>

      <ImageUploadDialog
        isOpen={isImageDialogOpen}
        onOpenChange={setIsImageDialogOpen}
        onImageSelect={onCoverImageChange}
      />
    </>
  );
}
