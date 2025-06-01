import { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const accessToken = req.cookies["auth-session"];
  const refreshToken = req.cookies["refresh-token"];

  if (!accessToken && !refreshToken) {
    res.status(401).json({ error: "No session found" });
    return;
  }

  try {
    if (accessToken) {
      // First try with access token
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser(accessToken);

      if (!userError && user) {
        req.user = user;
        next();
        return;
      }
    }

    // If no access token or it's invalid, try refresh flow
    if (!refreshToken) {
      res.status(401).json({ error: "Invalid session" });
      return;
    }

    // Try to refresh the session
    const {
      data: { session: newSession },
      error: refreshError,
    } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (refreshError || !newSession) {
      res.clearCookie("auth-session");
      res.clearCookie("refresh-token");
      res.status(401).json({ error: "Invalid session" });
      return;
    }

    // Set new tokens
    res.cookie("auth-session", newSession.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000, // 1 hour
      path: "/",
    });

    res.cookie("refresh-token", newSession.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    // Update Supabase client with new session
    supabase.auth.setSession({
      access_token: newSession.access_token,
      refresh_token: newSession.refresh_token,
    });

    req.user = newSession.user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Authentication failed" });
    return;
  }
};
