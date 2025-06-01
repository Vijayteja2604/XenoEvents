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
exports.uploadProfilePicture = exports.deleteAccount = exports.searchUsers = exports.editAccount = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const zod_1 = require("zod");
const supabase_1 = require("../lib/supabase");
const supabase_js_1 = require("@supabase/supabase-js");
const updateUserSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1),
    phoneNumber: zod_1.z.string().min(10).max(10).optional().nullable(),
    profilePicture: zod_1.z.string().optional().nullable(),
});
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// Edit User Profile
const editAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const validatedData = updateUserSchema.parse(req.body);
        const updatedUser = yield prisma_1.default.user.update({
            where: {
                id: userId,
            },
            data: validatedData,
            select: {
                id: true,
                fullName: true,
                phoneNumber: true,
            },
        });
        res.status(200).json(updatedUser);
    }
    catch (error) {
        console.error("Error editing user profile", error);
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                message: "Invalid input data",
                errors: error.errors,
            });
            return;
        }
        res.status(500).json({
            message: "Error editing user profile",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.editAccount = editAccount;
// Search all users
const searchUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.query;
        if (!email || typeof email !== "string") {
            res.status(400).json({ message: "Email query parameter is required" });
            return;
        }
        const users = yield prisma_1.default.user.findMany({
            where: {
                email: {
                    contains: email,
                    mode: "insensitive",
                },
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                profilePicture: true,
            },
            take: 5,
        });
        console.log("Found users:", users);
        res.status(200).json(users);
    }
    catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({
            message: "Error searching users",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.searchUsers = searchUsers;
// Delete User Account
const deleteAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        // Use transaction to ensure all related data is deleted
        yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Delete all event attendee records for this user
            yield tx.eventAttendee.deleteMany({
                where: { userId },
            });
            // Delete all event team memberships for this user
            yield tx.eventTeam.deleteMany({
                where: { userId },
            });
            // Finally delete the user from our database
            yield tx.user.delete({
                where: { id: userId },
            });
        }));
        // Delete user from Supabase Auth
        const { error: supabaseError } = yield supabase_1.supabaseAdmin.auth.admin.deleteUser(userId);
        if (supabaseError) {
            throw new Error(`Failed to delete Supabase auth user: ${supabaseError.message}`);
        }
        // Clear auth cookies
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
        res.status(200).json({ message: "Account deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({
            message: "Error deleting account",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.deleteAccount = deleteAccount;
const uploadProfilePicture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const file = (_a = req.files) === null || _a === void 0 ? void 0 : _a.image;
        if (!file) {
            res.status(400).json({ message: "No image file provided" });
            return;
        }
        // Generate a unique filename
        const timestamp = Date.now();
        const fileExt = file.name.split(".").pop();
        const fileName = `profile-pictures/${req.user.id}/${timestamp}.${fileExt}`;
        try {
            const { data, error } = yield supabase.storage
                .from("profiles")
                .upload(fileName, file.data, {
                contentType: file.mimetype,
                cacheControl: "3600",
                upsert: false,
            });
            if (error)
                throw error;
            const { data: { publicUrl }, } = supabase.storage.from("profiles").getPublicUrl(fileName);
            res.status(200).json({ url: publicUrl });
        }
        catch (uploadError) {
            console.error("Upload error:", uploadError);
            res.status(500).json({
                message: "Error uploading to storage",
                error: uploadError instanceof Error ? uploadError.message : "Unknown error",
            });
        }
    }
    catch (error) {
        console.error("Error handling upload:", error);
        res.status(500).json({
            message: "Error uploading image",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.uploadProfilePicture = uploadProfilePicture;
