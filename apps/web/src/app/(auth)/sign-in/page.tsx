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
import { Loader2Icon } from "lucide-react";
import Header from "@/components/Header";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const { signIn, signInWithGoogle } = useAuthActions();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { data: session, isLoading } = useSession();

  if (isLoading && callbackUrl) {
    return null;
  }

  if (session?.user) {
    router.push(callbackUrl || "/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const credentials = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    try {
      await signIn.mutateAsync(credentials);
      toast.success("Successfully signed in!");
      router.push(callbackUrl || "/");
    } catch (error: any) {
      console.error("Sign in error:", error?.response?.data || error);

      const errorMessage = error?.response?.data?.error || error.message;
      const errorCode = error?.response?.data?.code;

      switch (errorCode) {
        case "EMAIL_NOT_CONFIRMED":
          toast.error("Email Not Confirmed", {
            description:
              "Please check your inbox and confirm your email address",
            action: {
              label: "Resend",
              onClick: () => {
                toast.info("Resend confirmation email feature coming soon!");
              },
            },
          });
          break;

        case "INVALID_CREDENTIALS":
          toast.error("Invalid Credentials", {
            description: "The email or password you entered is incorrect",
          });
          break;

        case "USER_NOT_FOUND":
          toast.error("Account Not Found", {
            description: "No account exists with this email",
            action: {
              label: "Sign up",
              onClick: () => router.push("/sign-up"),
            },
          });
          break;

        default:
          const description =
            process.env.NODE_ENV === "development"
              ? `${errorMessage}\n${JSON.stringify(
                  error?.response?.data || error,
                  null,
                  2
                ).replace(/[{}]/g, "")}`
              : errorMessage || "An unexpected error occurred";

          toast.error("Sign In Failed", {
            description: description.trim(),
          });
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle.mutateAsync({
        callbackUrl: callbackUrl || undefined,
      });
    } catch (error: any) {
      setIsGoogleLoading(false);
      toast.error("Failed to sign in with Google", {
        description: error.message,
      });
    }
  };

  const handleForgotPassword = () => {
    toast.info("Password reset functionality coming soon!");
  };

  return (
    <><Header /><div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#ebf8ff] to-[#82cbf6] p-4">
      <div className="mx-auto max-w-xs space-y-4 rounded-xl bg-[#F9F9F8] p-6 sm:max-w-sm">
        <div className="flex flex-col items-center gap-2">
          <div className="space-y-3 text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to login to your account.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || signIn.isPending}
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
              <Label htmlFor="login-email">Email</Label>
              <Input
                className="placeholder:text-sm"
                id="login-email"
                name="email"
                placeholder="hi@yourcompany.com"
                type="email"
                required
                autoComplete="email"
                disabled={signIn.isPending}
              />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="login-password">Password</Label>
              <Input
                className="placeholder:text-sm"
                id="login-password"
                name="password"
                placeholder="Enter your password"
                type="password"
                required
                autoComplete="current-password"
                disabled={signIn.isPending}
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Button
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={handleForgotPassword}
              type="button"
            >
              Forgot password?
            </Button>
          </div>

          <Button
            variant="xeno"
            type="submit"
            className="w-full"
            disabled={signIn.isPending}
          >
            {signIn.isPending ? (
              <div className="flex items-center gap-2">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Signing in
              </div>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-blue-500 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div></>
  );
}
