/* eslint-disable @next/next/no-img-element */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, XIcon, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface ImageUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImageSelect: (imageData: { file: File; preview: string } | string) => void;
}

export default function ImageUploadDialog({
  isOpen,
  onOpenChange,
  onImageSelect,
}: ImageUploadDialogProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{
    file: File;
    preview: string;
  } | null>(null);
  const [isUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultImages = [
    "/event-placeholder-1.png",
    "/event-placeholder-2.png",
    "/event-placeholder-3.png",
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File) => {
    // Check file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload a PNG, JPG, or WebP file.");
      return false;
    }

    // Check file size (4MB)
    const maxSize = 4 * 1024 * 1024; // 4MB in bytes
    if (file.size > maxSize) {
      toast.error("File is too large. Maximum size is 4MB.");
      return false;
    }

    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage({
          file,
          preview: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const removeUploadedImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedImage(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleSave = () => {
    if (uploadedImage) {
      onImageSelect(uploadedImage);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl bg-[#F9F9F8] [&>button]:hidden my-8 mx-3 sm:mx-auto sm:my-0">
        <DialogHeader>
          <DialogTitle className="text-center">
            Upload Event Cover Image
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            Choose a cover image for your event. You can upload your own image
            or select from our defaults.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div
              className={`relative flex flex-col items-center justify-center rounded-lg border-[1px] border-dashed ${
                dragActive
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-blue-500 hover:border-blue-600 bg-white"
              } p-6 cursor-pointer group`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={handleButtonClick}
              role="button"
              tabIndex={0}
              aria-label="Upload image area"
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/jpg,image/png,image/svg+xml"
                onChange={handleChange}
              />

              {!uploadedImage ? (
                <>
                  <div className="text-center flex flex-col items-center">
                    <Upload
                      className={`mb-2 h-8 w-8 ${
                        dragActive ? "text-white" : "text-muted-foreground"
                      }`}
                    />
                    <p
                      className={`text-sm ${
                        dragActive
                          ? "text-white"
                          : "text-blue-500 group-hover:text-blue-600"
                      }`}
                    >
                      Click or drag and drop to upload your file
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        dragActive ? "text-white/80" : "text-muted-foreground"
                      }`}
                    >
                      Aspect ratio: 16:9
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        dragActive ? "text-white/80" : "text-muted-foreground"
                      }`}
                    >
                      PNG, JPG, SVG (Max 4 MB)
                    </p>
                  </div>
                </>
              ) : (
                <div className="relative w-full">
                  <img
                    src={uploadedImage.preview}
                    alt="Upload preview"
                    className="mx-auto max-h-[200px] rounded-lg object-contain"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-rose-500/80 p-1 hover:bg-rose-500 text-white hover:text-white"
                    onClick={(e) => removeUploadedImage(e)}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#F9F9F8] px-2 text-muted-foreground">
                OR
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {defaultImages.map((image, index) => (
              <button
                key={index}
                onClick={() => {
                  onImageSelect(image);
                  onOpenChange(false);
                }}
                className="overflow-hidden rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <img
                  src={image}
                  alt={`Default event cover ${index + 1}`}
                  className="aspect-[4/3] h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white"
            onClick={handleSave}
            disabled={!uploadedImage || isUploading}
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading
              </div>
            ) : (
              "Select image"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
