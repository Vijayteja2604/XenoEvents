"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function EmailVerificationSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#ebf8ff] p-4">
      <Card className="w-full max-w-md overflow-hidden border-none shadow-none">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-6">
            <Image
              src="/Xeno.svg"
              alt="Logo"
              width={120}
              height={120}
              draggable={false}
            />
            <div className="flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-primary">
                Email Verified Successfully
              </h1>
              <p className="text-muted-foreground">
                Your email has been verified. You can now safely close this
                window and sign in to your account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
