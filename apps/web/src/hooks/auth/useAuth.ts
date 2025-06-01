/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const authKeys = {
  session: ["auth", "session"] as const,
  user: ["auth", "user"] as const,
};

interface User {
  id: string;
  email: string;
  phoneNumber: string | null;
  fullName: string | null;
  profilePicture: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthError {
  message: string;
  status?: number;
}

interface AuthResponse {
  user: User;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface SignUpCredentials {
  email: string;
  phoneNumber: string;
  password: string;
  fullName: string;
}

export interface GoogleSignInOptions {
  callbackUrl?: string;
}

export const useSession = () => {
  return useQuery<AuthResponse, AuthError>({
    queryKey: authKeys.session,
    queryFn: api.verifySession,
    retry: (failureCount, error) => {
      // Don't retry if there's no session or if we've tried 3 times
      return failureCount < 3 && error.message !== "No session found" && error.message !== "Invalid session";
    },
    staleTime: 1000 * 60 * 30, // Consider data fresh for 30 minutes
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
};

export const useUser = () => {
  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: () => api.getUser(),
    retry: (failureCount, error: any) => {
      // Don't retry on 401 unauthorized errors
      if (error?.response?.status === 401) {
        return false;
      }
      // For other errors, retry up to 3 times
      return failureCount < 3;
    },
    staleTime: 1000 * 60 * 5,
  });

  return userQuery;
};

export const useAuthActions = () => {
  const queryClient = useQueryClient();

  const signInMutation = useMutation<
    AuthResponse,
    AuthError,
    SignInCredentials
  >({
    mutationFn: ({ email, password }) => api.signin(email, password),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.session, data);
      queryClient.setQueryData(authKeys.user, data);
    },
  });

  const signUpMutation = useMutation<
    AuthResponse,
    AuthError,
    SignUpCredentials
  >({
    mutationFn: (credentials) => api.signup(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.session, data);
      queryClient.setQueryData(authKeys.user, data);
    },
  });

  const signOutMutation = useMutation<void, AuthError>({
    mutationFn: api.signout,
    onSuccess: () => {
      queryClient.removeQueries();
    },
  });

  const signInWithGoogleMutation = useMutation<
    void,
    AuthError,
    GoogleSignInOptions
  >({
    mutationFn: async (options?: GoogleSignInOptions) => {
      const baseUrl = `${
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"
      }/auth/google`;
      const url = options?.callbackUrl
        ? `${baseUrl}?callbackUrl=${encodeURIComponent(options.callbackUrl)}`
        : baseUrl;

      window.location.href = url;
    },
  });

  return {
    signIn: signInMutation,
    signUp: signUpMutation,
    signOut: signOutMutation,
    signInWithGoogle: signInWithGoogleMutation,
  };
};
