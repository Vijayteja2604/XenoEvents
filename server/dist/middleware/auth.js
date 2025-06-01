"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const supabase_1 = require("../lib/supabase");
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = req.cookies["auth-session"];
    const refreshToken = req.cookies["refresh-token"];
    if (!accessToken && !refreshToken) {
        res.status(401).json({ error: "No session found" });
        return;
    }
    try {
        if (accessToken) {
            // First try with access token
            const { data: { user }, error: userError, } = yield supabase_1.supabase.auth.getUser(accessToken);
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
        const { data: { session: newSession }, error: refreshError, } = yield supabase_1.supabase.auth.refreshSession({ refresh_token: refreshToken });
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
        supabase_1.supabase.auth.setSession({
            access_token: newSession.access_token,
            refresh_token: newSession.refresh_token,
        });
        req.user = newSession.user;
        next();
    }
    catch (error) {
        console.error("Auth middleware error:", error);
        res.status(401).json({ error: "Authentication failed" });
        return;
    }
});
exports.authMiddleware = authMiddleware;
