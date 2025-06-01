import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import prisma from "../lib/prisma";

// Get event team members (creator and admins) (More)
export const getEventMore = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { userId } = req.user;

    const isCreatorOrAdmin = await prisma.eventTeam.findFirst({
      where: {
        event: { eventId },
        userId,
        role: {
          in: ["CREATOR", "ADMIN"],
        },
      },
    });

    if (!isCreatorOrAdmin) {
      res.status(403).json({
        message: "Only the creator or admins can view the settings page",
      });
      return;
    }

    const eventTeam = await prisma.eventTeam.findMany({
      where: {
        event: {
          eventId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profilePicture: true,
          },
        },
      },
      orderBy: {
        role: "asc", // CREATOR will come before ADMIN
      },
    });

    if (!eventTeam.length) {
      res.status(404).json({ message: "Event team not found" });
      return;
    }

    // Transform the data to match the frontend needs
    const transformedTeam = eventTeam.map((member) => ({
      id: member.user.id,
      name: member.user.fullName,
      email: member.user.email,
      image: member.user.profilePicture,
      role: member.role.toLowerCase(),
    }));

    res.status(200).json(transformedTeam);
  } catch (error) {
    console.error("Error fetching event team:", error);
    res.status(500).json({
      message: "Error fetching event team",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Add admin to event (More)
export const addAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    // Validate request body
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    // Check if the requesting user is the creator
    const isCreator = await prisma.eventTeam.findFirst({
      where: {
        event: { eventId },
        userId: req.user.id,
        role: "CREATOR",
      },
    });

    if (!isCreator) {
      res.status(403).json({ message: "Only the creator can add admins" });
      return;
    }

    // Check if user is already in the team
    const existingTeamMember = await prisma.eventTeam.findFirst({
      where: {
        event: { eventId },
        userId,
      },
    });

    if (existingTeamMember) {
      res.status(400).json({ message: "User is already in the event team" });
      return;
    }

    // Add user as admin
    const newAdmin = await prisma.eventTeam.create({
      data: {
        event: {
          connect: {
            eventId,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },
        role: "ADMIN",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profilePicture: true,
          },
        },
      },
    });

    res.status(201).json({
      id: newAdmin.user.id,
      name: newAdmin.user.fullName,
      email: newAdmin.user.email,
      image: newAdmin.user.profilePicture,
      role: newAdmin.role.toLowerCase(),
    });
  } catch (error) {
    console.error("Error adding admin:", error);
    res.status(500).json({
      message: "Error adding admin",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Remove admin from event (More)
export const removeAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    // Validate request body
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    // Check if the requesting user is the creator
    const isCreator = await prisma.eventTeam.findFirst({
      where: {
        event: { eventId },
        userId: req.user.id,
        role: "CREATOR",
      },
    });

    if (!isCreator) {
      res.status(403).json({ message: "Only the creator can remove admins" });
      return;
    }

    // Check if target user is an admin
    const adminToRemove = await prisma.eventTeam.findFirst({
      where: {
        event: { eventId },
        userId,
        role: "ADMIN",
      },
    });

    if (!adminToRemove) {
      res.status(404).json({ message: "Admin not found" });
      return;
    }

    // Remove admin
    await prisma.eventTeam.delete({
      where: {
        id: adminToRemove.id,
      },
    });

    res.status(200).json({ message: "Admin removed successfully" });
  } catch (error) {
    console.error("Error removing admin:", error);
    res.status(500).json({
      message: "Error removing admin",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Delete event (More)
export const deleteEvent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;

    // Check if the requesting user is the creator
    const isCreator = await prisma.eventTeam.findFirst({
      where: {
        event: { eventId },
        userId: req.user.id,
        role: "CREATOR",
      },
    });

    if (!isCreator) {
      res
        .status(403)
        .json({ message: "Only the creator can delete the event" });
      return;
    }

    // Get the event to check if it exists and get its ID
    const event = await prisma.event.findUnique({
      where: { eventId },
      select: { id: true, locationId: true },
    });

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    // Use transaction to ensure all related data is deleted
    await prisma.$transaction(async (tx) => {
      // Delete event attendees
      await tx.eventAttendee.deleteMany({
        where: { eventId },
      });

      // Delete event team members
      await tx.eventTeam.deleteMany({
        where: { eventId: event.id },
      });

      // Delete contact persons
      await tx.contactPerson.deleteMany({
        where: { eventId: event.id },
      });

      // Delete the location if it exists
      if (event.locationId) {
        await tx.location.delete({
          where: { id: event.locationId },
        });
      }

      // Finally delete the event
      await tx.event.delete({
        where: { eventId },
      });
    });

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({
      message: "Error deleting event",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Get event overview (Overview)
export const getEventOverview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: {
        eventId,
      },
      select: {
        eventId: true,
        name: true,
        startDate: true,
        endDate: true,
        coverImage: true,
        locationType: true,
        meetingLink: true,
        location: {
          select: {
            mainText: true,
            secondaryText: true,
            locationAdditionalDetails: true,
          },
        },
        team: {
          where: {
            userId: req.user.id,
            role: {
              in: ["CREATOR", "ADMIN"],
            },
          },
        },
      },
    });

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    if (event.team.length === 0) {
      res.status(403).json({
        message: "Only the creator or admins can view the event overview",
      });
      return;
    }

    // Remove the team data and return only needed fields
    const { team, ...eventData } = event;

    res.status(200).json(eventData);
  } catch (error) {
    console.error("Error fetching event overview:", error);
    res.status(500).json({
      message: "Error fetching event overview",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
