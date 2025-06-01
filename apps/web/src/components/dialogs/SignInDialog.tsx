/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { useAuthActions } from "@/hooks/auth/useAuth";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2Icon } from "lucide-react";

interface SignInFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToSignUp: () => void;
  isLoading?: boolean;
  callbackUrl?: string;
}

export function SignInForm({
  open,
  onOpenChange,
  onSwitchToSignUp,
  callbackUrl,
}: SignInFormProps) {
  const { signIn, signInWithGoogle } = useAuthActions();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
      onOpenChange(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
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
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[50%] mx-auto max-w-xs translate-y-[-50%] rounded-xl bg-[#F9F9F8] sm:max-w-sm">
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <DialogHeader>
              <DialogTitle className="text-center text-2xl font-bold">
                Welcome back
              </DialogTitle>
              <DialogDescription className="text-center">
                Enter your credentials to login to your account.
              </DialogDescription>
            </DialogHeader>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || signIn.isPending}
          >
            <Image src="/Google.svg" alt="Google Logo" width={14} height={14} />
            {isGoogleLoading ? "Loading..." : "Continue with Google"}
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
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600"
              disabled={signIn.isPending}
            >
              {signIn.isPending ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Signing in
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToSignUp}
              className="text-blue-500 hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
