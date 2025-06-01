/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuthActions, useSession } from "@/hooks/auth/useAuth";
import Header from "@/components/Header";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const { signUp, signInWithGoogle } = useAuthActions();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { data: session, isLoading } = useSession();

  if (isLoading) {
    return null;
  }

  if (session) {
    router.push(callbackUrl || "/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const credentials = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      fullName: formData.get("name") as string,
      phoneNumber: formData.get("phone") as string,
    };

    try {
      await signUp.mutateAsync(credentials);

      toast.success("Account created successfully!");
      router.push(callbackUrl || "/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create account"
      );
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle.mutateAsync({
        callbackUrl: callbackUrl || undefined,
      });
    } catch (error: any) {
      setIsGoogleLoading(false);
      toast.error("Failed to sign up with Google", {
        description: error.message,
      });
    }
  };

  return (
    <><Header /><div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#ebf8ff] to-[#82cbf6] p-4">
      <div className="mx-auto max-w-xs space-y-4 rounded-xl bg-[#F9F9F8] p-6 sm:max-w-sm">
        <div className="flex flex-col items-center gap-2">
          <div className="space-y-3 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Sign up</h1>
            <p className="text-sm text-muted-foreground">
              We just need a few details to get you started.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading}
        >
          <Image src="/Google.svg" alt="Google Logo" width={14} height={14} />
          {isGoogleLoading ? "Loading" : "Continue with Google"}
        </Button>

        <div className="flex items-center gap-2 before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
          <span className="text-xs text-muted-foreground">or</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-0.5">
              <Label htmlFor="signup-name">Full name</Label>
              <Input
                className="placeholder:text-sm"
                id="signup-name"
                name="name"
                placeholder="John Doe"
                type="text"
                required
                autoComplete="name"
                disabled={signUp.isPending} />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                className="placeholder:text-sm"
                id="signup-email"
                name="email"
                placeholder="john@doe.com"
                type="email"
                required
                autoComplete="email"
                disabled={signUp.isPending} />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="signup-phone">Phone number</Label>
              <div className="flex rounded-lg">
                    <span className="inline-flex items-center rounded-s-lg border border-input px-2.5 text-sm text-muted-foreground bg-gray-100">
                      +91
                    </span>
                    <Input
                      className="h-9 text-xs shadow-none placeholder:text-xs sm:text-sm sm:placeholder:text-sm -ms-px rounded-s-none"
                      id="signup-phone"
                      name="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      disabled={signUp.isPending} 
                      minLength={10}
                      maxLength={10}
                      />
                  </div>
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                className="placeholder:text-sm"
                id="signup-password"
                name="password"
                placeholder="Enter your password"
                type="password"
                required
                autoComplete="new-password"
                disabled={signUp.isPending}
              />
            </div>
          </div>

          <Button
            variant="xeno"  
            type="submit"
            className="w-full"
            disabled={signUp.isPending}
          >
            {signUp.isPending ? "Creating account..." : "Sign up"}
          </Button>
        </form>

        <div className="space-y-2 text-center text-xs">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-blue-500 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div></>
  );
}
