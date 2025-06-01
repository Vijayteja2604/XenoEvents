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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabase_1 = require("../lib/supabase");
const prisma_1 = __importDefault(require("../lib/prisma"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = require("../middleware/auth");
const googleapis_1 = require("googleapis");
const router = express_1.default.Router();
router.use((0, cookie_parser_1.default)());
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URL = process.env.GOOGLE_REDIRECT_URL ||
    "http://localhost:3000/auth/callback/google";
const oauth2Client = new googleapis_1.google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URL);
// Sign Up endpoint
router.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, phoneNumber, fullName } = req.body;
    try {
        // 1. Create Supabase auth user
        const { data: authData, error: authError } = yield supabase_1.supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${process.env.CLIENT_URL}/email-verified`,
            },
        });
        if (authError)
            throw authError;
        // 2. Create user in our database
        if (authData.user) {
            const user = yield prisma_1.default.user.create({
                data: {
                    id: authData.user.id,
                    email: authData.user.email,
                    phoneNumber,
                    fullName,
                },
            });
            if (authData.session) {
                res.cookie("refresh-token", authData.session.refresh_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                    path: "/",
                });
                res.cookie("auth-session", authData.session.access_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                    maxAge: 60 * 60 * 1000,
                    path: "/",
                });
            }
            res.json({ user });
        }
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Sign In endpoint
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    console.log("Sign in attempt for email:", email);
    try {
        // 1. Attempt Supabase authentication
        console.log("Attempting Supabase authentication...");
        const { data, error } = yield supabase_1.supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            // Handle specific Supabase auth errors
            console.error("Supabase auth error details:", {
                message: error.message,
                status: error.status,
                name: error.name,
            });
            switch (error.message) {
                case "Invalid login credentials":
                    throw new Error("Invalid email or password");
                case "Email not confirmed":
                case "You must confirm your email address before continuing.":
                    throw new Error("Email not confirmed");
                case "Invalid email or password":
                    throw new Error("Invalid email or password");
                default:
                    // Log the exact error for debugging
                    console.error("Unhandled Supabase error:", error);
                    throw new Error(error.message);
            }
        }
        console.log("Supabase auth successful, user ID:", data.user.id);
        // 2. Get user data from our database
        console.log("Fetching user from database...");
        const user = yield prisma_1.default.user.findUnique({
            where: { id: data.user.id },
            select: {
                id: true,
                email: true,
                phoneNumber: true,
                fullName: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            console.error("User not found in database for ID:", data.user.id);
            throw new Error("User not found in database");
        }
        console.log("User found in database:", user.id);
        // 3. Set auth cookie
        console.log("Setting auth cookie...");
        res.cookie("refresh-token", data.session.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/",
        });
        res.cookie("auth-session", data.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 1000,
            path: "/",
        });
        console.log("Sign in successful, sending response");
        res.json({ user });
    }
    catch (error) {
        console.error("Sign in error:", error);
        // Send specific status codes based on error type
        if (error.message === "Email not confirmed" ||
            error.message === "You must confirm your email address before continuing.") {
            res.status(403).json({
                error: "Please check your inbox and confirm your email before signing in",
                code: "EMAIL_NOT_CONFIRMED",
            });
        }
        else if (error.message === "Invalid email or password" ||
            error.message === "Invalid login credentials") {
            res.status(401).json({
                error: "Invalid email or password",
                code: "INVALID_CREDENTIALS",
            });
        }
        else if (error.message === "User not found in database") {
            res.status(404).json({
                error: "Account not found",
                code: "USER_NOT_FOUND",
            });
        }
        else {
            // Log unexpected errors for debugging
            console.error("Unexpected error during sign in:", error);
            res.status(500).json({
                error: "An unexpected error occurred",
                code: "SERVER_ERROR",
                details: process.env.NODE_ENV === "development" ? error.message : undefined,
            });
        }
    }
}));
// Sign Out endpoint
router.post("/signout", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie("auth-session", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });
    res.clearCookie("refresh-token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });
    res.json({ message: "Signed out successfully" });
}));
// Get current user endpoint
router.get("/user", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.default.user.findUnique({
            where: { id: req.user.id },
        });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
// Verify session endpoint
router.get("/verify-session", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.default.user.findUnique({
            where: { id: req.user.id },
        });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
router.get("/google", (req, res) => {
    try {
        const { callbackUrl } = req.query;
        if (callbackUrl) {
            res.cookie("auth-callback-url", callbackUrl, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 5 * 60 * 1000, // 5 minutes
                path: "/",
            });
        }
        const url = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: [
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email",
            ],
            prompt: "consent",
            include_granted_scopes: true,
        });
        console.log("Generated Google OAuth URL:", url);
        res.redirect(url);
    }
    catch (error) {
        console.error("Error generating Google OAuth URL:", error);
        res.redirect(`${process.env.CLIENT_URL}/sign-in?error=google_auth_failed`);
    }
});
router.get("/callback/google", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code } = req.query;
    const callbackUrl = req.cookies["auth-callback-url"];
    try {
        console.log("Received Google callback with code:", code);
        // Exchange code for tokens
        const { tokens } = yield oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        // Get user info from Google
        const oauth2Service = googleapis_1.google.oauth2("v2");
        const { data } = yield oauth2Service.userinfo.get({ auth: oauth2Client });
        // Verify we have the required data
        if (!data.email || !data.name) {
            throw new Error("Missing required user data from Google");
        }
        // Check if user exists
        let user = yield prisma_1.default.user.findFirst({
            where: { email: data.email },
        });
        if (!user) {
            // Create new user if doesn't exist
            const { data: authData, error: authError } = yield supabase_1.supabase.auth.signUp({
                email: data.email,
                password: `google_${data.id}`,
                options: {
                    emailRedirectTo: `${process.env.CLIENT_URL}`,
                    data: {
                        email_confirmed: true,
                    },
                },
            });
            if (authError)
                throw authError;
            if (authData.user) {
                user = yield prisma_1.default.user.create({
                    data: {
                        id: authData.user.id,
                        email: data.email,
                        fullName: data.name,
                        phoneNumber: null,
                        profilePicture: data.picture || null,
                    },
                });
            }
        }
        else {
            // Update existing user's profile picture if it's not set
            if (!user.profilePicture && data.picture) {
                user = yield prisma_1.default.user.update({
                    where: { id: user.id },
                    data: {
                        profilePicture: data.picture,
                    },
                });
            }
        }
        // Sign in with Supabase
        let authData;
        let authError;
        ({ data: authData, error: authError } =
            yield supabase_1.supabase.auth.signInWithPassword({
                email: data.email,
                password: `google_${data.id}`,
            }));
        if (authError) {
            // If sign in fails, try admin update to confirm email and then sign in again
            yield supabase_1.supabaseAdmin.auth.admin.updateUserById(user.id, {
                email_confirm: true,
                user_metadata: { email_confirmed: true },
            });
            // Try signing in again
            const { data: retryAuthData, error: retryError } = yield supabase_1.supabase.auth.signInWithPassword({
                email: data.email,
                password: `google_${data.id}`,
            });
            if (retryError)
                throw retryError;
            authData = retryAuthData;
        }
        // Set session cookie
        if (authData === null || authData === void 0 ? void 0 : authData.session) {
            res.cookie("refresh-token", authData.session.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: "/",
            });
            res.cookie("auth-session", authData.session.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 1000,
                path: "/",
            });
        }
        // Redirect to frontend with callback URL if it exists
        res.redirect(`${process.env.CLIENT_URL}${callbackUrl || ""}` ||
            `http://localhost:3000${callbackUrl || ""}`);
    }
    catch (error) {
        console.error("Detailed Google auth error:", {
            message: error.message,
            stack: error.stack,
            details: error,
        });
        res.redirect(`${process.env.CLIENT_URL}/sign-in?error=google_auth_failed`);
    }
}));
exports.default = router;
