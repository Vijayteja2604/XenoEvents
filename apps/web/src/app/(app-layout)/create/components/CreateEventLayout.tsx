import { ReactNode } from "react";
import { CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CreateEventLayoutProps {
  children: ReactNode;
  onSubmit: () => void;
  submitButtonText?: React.ReactNode;
  disabled?: boolean;
}

export default function CreateEventLayout({
  children,
  onSubmit,
  submitButtonText,
  disabled,
}: CreateEventLayoutProps) {
  return (
    <div className="pb-8">
      {children}
      <CardFooter>
        <Button
          onClick={onSubmit}
          className="w-full bg-blue-500 hover:bg-blue-600 rounded-lg"
          disabled={disabled}
        >
          {submitButtonText}
        </Button>
      </CardFooter>
    </div>
  );
}
