import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import prisma from "../lib/prisma";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { UploadedFile } from "express-fileupload";

const updateUserSchema = z.object({
  fullName: z.string().min(1),
  phoneNumber: z.string().min(10).max(10).optional().nullable(),
  profilePicture: z.string().optional().nullable(),
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Edit User Profile
export const editAccount = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user.id;

    const validatedData = updateUserSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
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
  } catch (error) {
    console.error("Error editing user profile", error);

    if (error instanceof z.ZodError) {
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
};

// Search all users
export const searchUsers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== "string") {
      res.status(400).json({ message: "Email query parameter is required" });
      return;
    }

    const users = await prisma.user.findMany({
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
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({
      message: "Error searching users",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Delete User Account
export const deleteAccount = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user.id;

    // Use transaction to ensure all related data is deleted
    await prisma.$transaction(async (tx) => {
      // Delete all event attendee records for this user
      await tx.eventAttendee.deleteMany({
        where: { userId },
      });

      // Delete all event team memberships for this user
      await tx.eventTeam.deleteMany({
        where: { userId },
      });

      // Finally delete the user from our database
      await tx.user.delete({
        where: { id: userId },
      });
    });

    // Delete user from Supabase Auth
    const { error: supabaseError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (supabaseError) {
      throw new Error(
        `Failed to delete Supabase auth user: ${supabaseError.message}`
      );
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
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({
      message: "Error deleting account",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

export const uploadProfilePicture = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const file = req.files?.image as UploadedFile;

    if (!file) {
      res.status(400).json({ message: "No image file provided" });
      return;
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const fileName = `profile-pictures/${req.user.id}/${timestamp}.${fileExt}`;

    try {
      const { data, error } = await supabase.storage
        .from("profiles")
        .upload(fileName, file.data, {
          contentType: file.mimetype,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("profiles").getPublicUrl(fileName);

      res.status(200).json({ url: publicUrl });
    } catch (uploadError) {
      console.error("Upload error:", uploadError);
      res.status(500).json({
        message: "Error uploading to storage",
        error:
          uploadError instanceof Error ? uploadError.message : "Unknown error",
      });
    }
  } catch (error) {
    console.error("Error handling upload:", error);
    res.status(500).json({
      message: "Error uploading image",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
