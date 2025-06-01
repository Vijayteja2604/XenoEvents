import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Add routes that require authentication
const protectedRoutes = [
  "/events",
  "/create",
  "/settings",
  "/e/[eventId]/check-in",
  "/e/[eventId]/settings",
];

// Add routes that should redirect to /events if user is already authenticated
const authRoutes = ["/sign-in", "/sign-up"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth session from cookie
  const authSession = request.cookies.get("auth-session");

  // Helper function to check if a path matches a route pattern
  const matchesPattern = (pattern: string, path: string) => {
    // Convert route pattern to regex
    // Replace [paramName] with a regex pattern that matches anything except /
    const regexPattern = pattern.replace(/\[.*?\]/g, "[^/]+");
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  };

  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => {
    // If the route contains a parameter (e.g., [eventId])
    if (route.includes("[")) {
      return matchesPattern(route, pathname);
    }
    // Otherwise, use the original startsWith check
    return pathname.startsWith(route);
  });

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // If it's a protected route and user is not authenticated, redirect to sign in
  if (isProtectedRoute && !authSession) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If user is authenticated and tries to access auth routes, redirect to home
  if (isAuthRoute && authSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Configure matcher for routes that should trigger the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
