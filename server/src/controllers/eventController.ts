import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { PriceType, LocationType, VisibilityType } from "@prisma/client";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const contactPersonSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
});

const locationSchema = z.object({
  placeId: z.string().optional().nullable(),
  description: z.string(),
  mainText: z.string().optional().nullable(),
  secondaryText: z.string().optional().nullable(),
  locationAdditionalDetails: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  isCustom: z.boolean().optional().default(false),
});

const createEventSchema = z
  .object({
    name: z.string().min(1),
    description: z
      .string()
      .min(1)
      .transform((str) => {
        try {
          return JSON.parse(str);
        } catch {
          // If it's not valid JSON, return a basic JSON structure
          return {
            type: "doc",
            content: [
              { type: "paragraph", content: [{ type: "text", text: str }] },
            ],
          };
        }
      }),
    organizer: z.string().min(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    locationType: z.nativeEnum(LocationType),
    locationId: z.string().optional(),
    location: locationSchema.optional(),
    meetingLink: z.string().optional().nullable(),
    coverImage: z.string().optional().nullable(),
    capacity: z.number().int().positive().optional().nullable(),
    price: z.number().min(0).optional().nullable(),
    priceType: z.nativeEnum(PriceType).default("FREE"),
    visibility: z.nativeEnum(VisibilityType).default("PUBLIC"),
    requireApproval: z.boolean().default(false),
    websiteUrl: z.string().optional().nullable(),
    contactPersons: z.array(contactPersonSchema),
  })
  .refine(
    (data) => {
      if (data.locationType === "VENUE") {
        return !!data.locationId || !!data.location;
      }
      return true;
    },
    {
      message: "Location information is required for venue events",
    }
  );

// Add this helper function at the top of the file
const checkEventPermissions = async (eventId: string, userId: string) => {
  const eventTeamMember = await prisma.eventTeam.findFirst({
    where: {
      event: {
        eventId,
      },
      userId,
      role: {
        in: ["CREATOR", "ADMIN"],
      },
    },
  });

  if (!eventTeamMember) {
    throw new Error("Unauthorized access to event");
  }
};

// Create Event
export const createEvent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { customAlphabet } = await import("nanoid");
    const alphabet =
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    const eventNanoId = customAlphabet(alphabet, 12);

    // Validate request body
    if (!req.body) {
      res.status(400).json({ message: "Request body is required" });
      return;
    }

    const validatedData = createEventSchema.parse(req.body);

    let locationId: string | null = null;

    // Only process location if it's a VENUE event
    if (validatedData.locationType === "VENUE") {
      if (validatedData.locationId) {
        const existingLocation = await prisma.location.findUnique({
          where: { id: validatedData.locationId },
        });

        if (!existingLocation) {
          res.status(400).json({ message: "Invalid location ID" });
          return;
        }
        locationId = validatedData.locationId;
      } else if (validatedData.location) {
        const newLocation = await prisma.location.create({
          data: validatedData.location,
        });
        locationId = newLocation.id;
      } else {
        res.status(400).json({
          message: "Location information is required for venue events",
        });
        return;
      }
    }

    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (endDate <= startDate) {
      res.status(400).json({
        message: "End date must be after start date",
      });
      return;
    }

    const { location, ...eventData } = validatedData;

    const event = await prisma.event.create({
      data: {
        eventId: eventNanoId(),
        ...eventData,
        description: JSON.stringify(eventData.description),
        locationId: locationId!,
        contactPersons: {
          create: validatedData.contactPersons,
        },
        team: {
          create: {
            userId: req.user.id,
            role: "CREATOR",
          },
        },
      },
      include: {
        contactPersons: true,
        location: true,
        team: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Server error in createEvent:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Invalid input data",
        errors: error.errors,
      });
      return;
    }

    res.status(500).json({
      message: "Error creating event",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Edit Event
export const editEvent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // Check permissions
    await checkEventPermissions(eventId, userId);

    // Validate request body
    if (!req.body) {
      res.status(400).json({ message: "Request body is required" });
      return;
    }

    const validatedData = createEventSchema.parse(req.body);

    let locationId: string | null = null;

    // Only process location if it's a VENUE event
    if (validatedData.locationType === "VENUE") {
      if (validatedData.locationId) {
        const existingLocation = await prisma.location.findUnique({
          where: { id: validatedData.locationId },
        });

        if (!existingLocation) {
          res.status(400).json({ message: "Invalid location ID" });
          return;
        }
        locationId = validatedData.locationId;
      } else if (validatedData.location) {
        // If the event already has a location, update it
        const event = await prisma.event.findUnique({
          where: { eventId },
          select: { locationId: true },
        });

        if (event?.locationId) {
          await prisma.location.update({
            where: { id: event.locationId },
            data: validatedData.location,
          });
          locationId = event.locationId;
        } else {
          // Create new location if none exists
          const newLocation = await prisma.location.create({
            data: validatedData.location,
          });
          locationId = newLocation.id;
        }
      }
    }

    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (endDate <= startDate) {
      res.status(400).json({
        message: "End date must be after start date",
      });
      return;
    }

    const { location, contactPersons, ...eventData } = validatedData;

    // Get the original event to check its type and approval requirement
    const originalEvent = await prisma.event.findUnique({
      where: { eventId },
      select: {
        locationType: true,
        requireApproval: true,
        attendees: {
          where: {
            OR: [
              {
                isApproved: true,
                ticketId: null, // For online to venue conversion
              },
              {
                isApproved: false, // For approval requirement change
              },
            ],
          },
          select: {
            id: true,
            isApproved: true,
          },
        },
      },
    });

    if (!originalEvent) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    // Prepare updates for attendees
    let attendeeUpdates: any[] = [];

    // If changing from ONLINE to VENUE, create tickets for existing approved attendees
    if (
      originalEvent.locationType === "ONLINE" &&
      validatedData.locationType === "VENUE"
    ) {
      const { nanoid } = await import("nanoid");

      // Add ticket updates for approved attendees without tickets
      attendeeUpdates.push(
        ...originalEvent.attendees
          .filter((attendee) => attendee.isApproved)
          .map((attendee) =>
            prisma.eventAttendee.update({
              where: { id: attendee.id },
              data: {
                ticketId: randomUUID(),
                ticketCode: nanoid(18),
              },
            })
          )
      );
    }

    // If changing from requiring approval to not requiring approval
    if (originalEvent.requireApproval && !validatedData.requireApproval) {
      const { nanoid } = await import("nanoid");
      // Add approval updates for unapproved attendees
      attendeeUpdates.push(
        ...originalEvent.attendees
          .filter((attendee) => !attendee.isApproved)
          .map((attendee) =>
            prisma.eventAttendee.update({
              where: { id: attendee.id },
              data: {
                isApproved: true,
                ...(validatedData.locationType === "VENUE"
                  ? {
                      ticketId: randomUUID(),
                      ticketCode: nanoid(18),
                    }
                  : {}),
              },
            })
          )
      );
    }

    // Execute all attendee updates in parallel if there are any
    if (attendeeUpdates.length > 0) {
      await prisma.$transaction(attendeeUpdates);
    }

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { eventId },
      data: {
        ...eventData,
        description: JSON.stringify(eventData.description),
        locationId: locationId,
        // Update contact persons
        contactPersons: {
          deleteMany: {}, // Remove all existing contact persons
          create: contactPersons, // Create new ones
        },
      },
      include: {
        contactPersons: true,
        location: true,
        team: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error("Server error in editEvent:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Invalid input data",
        errors: error.errors,
      });
      return;
    }

    res.status(500).json({
      message: "Error updating event",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Get Event
export const getEvent = async (req: Request, res: Response): Promise<void> => {
  const { eventId } = req.params;

  try {
    // Get event with attendee count
    const event = await prisma.event.findUnique({
      where: {
        eventId,
      },
      include: {
        location: true,
        contactPersons: true,
        _count: {
          select: {
            attendees: {
              where: {
                isApproved: true, // Only count approved attendees
              },
            },
          },
        },
      },
    });

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    // Calculate spots left if capacity exists
    const spotsLeft =
      event.capacity !== null ? event.capacity - event._count.attendees : null;

    // Remove _count from response and add spotsLeft
    const { _count, ...eventData } = event;

    res.status(200).json({
      ...eventData,
      capacity: event.capacity,
      spotsLeft: spotsLeft,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({
      message: "Error fetching event",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Get all Public Events
export const getPublicEvents = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [events, total] = await prisma.$transaction([
      prisma.event.findMany({
        where: {
          visibility: "PUBLIC",
          endDate: {
            gte: new Date().toISOString(),
          },
        },
        select: {
          eventId: true,
          coverImage: true,
          name: true,
          startDate: true,
          endDate: true,
          locationType: true,
          location: {
            select: {
              mainText: true,
            },
          },
        },
        orderBy: {
          startDate: "asc",
        },
        take: limit,
        skip: skip,
      }),
      prisma.event.count({
        where: {
          visibility: "PUBLIC",
          endDate: {
            gte: new Date().toISOString(),
          },
        },
      }),
    ]);

    res.status(200).json({
      events,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Server error in getPublicEvents:", error);
    res.status(500).json({
      message: "Error fetching public events",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Check User's role for event
export const getUserEventRole = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await prisma.event.findUnique({
      where: {
        eventId,
      },
      include: {
        team: {
          where: {
            userId,
          },
          select: {
            role: true,
          },
        },
      },
    });

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    const userRole = event.team[0]?.role || null;
    res.status(200).json({ role: userRole });
  } catch (error) {
    console.error("Error fetching user role:", error);
    res.status(500).json({
      message: "Error fetching user role",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Register User for Event
export const registerUserForEvent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const { nanoid } = await import("nanoid");
    const ticketCode = nanoid(18);

    const registerUser = await prisma.$transaction(async (tx) => {
      // Check if user is already registered
      const existingRegistration = await tx.eventAttendee.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
      });

      if (existingRegistration) {
        throw new Error("ALREADY_REGISTERED");
      }

      const event = await tx.event.findUniqueOrThrow({
        where: { eventId },
        select: {
          requireApproval: true,
          capacity: true,
          locationType: true,
        },
      });

      // If capacity is set, check current attendee count
      if (event.capacity !== null) {
        const attendeeCount = await tx.eventAttendee.count({
          where: {
            eventId,
            // Only count approved attendees if event requires approval
            ...(event.requireApproval ? { isApproved: true } : {}),
          },
        });

        if (attendeeCount >= event.capacity) {
          throw new Error("EVENT_FULL");
        }
      }

      const isApproved = !event.requireApproval;
      // Only generate ticketCode for VENUE events
      const shouldCreateTicket = event.locationType === "VENUE" && isApproved;

      const attendee = await tx.eventAttendee.create({
        data: {
          eventId,
          userId,
          isApproved,
          ticketId: shouldCreateTicket ? randomUUID() : null,
          ticketCode: shouldCreateTicket ? ticketCode : null,
        },
        include: {
          event: {
            select: { requireApproval: true },
          },
        },
      });

      return attendee;
    });

    res.status(200).json(registerUser);
  } catch (error: unknown) {
    console.error("Error registering user for event:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    if (error instanceof Error) {
      if (error.message === "EVENT_FULL") {
        res.status(400).json({ message: "Event has reached maximum capacity" });
        return;
      }
      if (error.message === "ALREADY_REGISTERED") {
        res
          .status(400)
          .json({ message: "You are already registered for this event" });
        return;
      }
    }

    res.status(500).json({
      message: "Error registering user for event",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Check if user is registered for event
export const checkRegistrationStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const registration = await prisma.eventAttendee.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      select: {
        id: true,
        isApproved: true,
        ticketId: true,
      },
    });

    res.status(200).json({ isRegistered: !!registration, registration });
  } catch (error) {
    console.error("Error checking registration status:", error);
    res.status(500).json({
      message: "Error checking registration status",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Get User's Events (Created, Admin, and Registered)
export const getUserEvents = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user.id;

    const events = await prisma.event.findMany({
      where: {
        OR: [
          {
            team: {
              some: {
                userId,
              },
            },
          },
          {
            attendees: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      select: {
        id: true,
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
            userId,
          },
          select: {
            role: true,
          },
        },
        attendees: {
          where: {
            userId,
          },
          select: {
            isApproved: true,
            ticketId: true,
          },
        },
        _count: {
          select: {
            attendees: {
              where: {
                isApproved: true,
              },
            },
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    // Transform the data to make it more frontend-friendly
    const transformedEvents = events.map((event) => ({
      ...event,
      // Only include location data for VENUE events, meetingLink for ONLINE events
      location: event.locationType === "VENUE" ? event.location : null,
      meetingLink: event.locationType === "ONLINE" ? event.meetingLink : null,
      userRole: event.team[0]?.role || null,
      registration: event.attendees[0] || null,
      approvedAttendeesCount: event._count.attendees,
      // Clean up the nested arrays and counts we don't need anymore
      team: undefined,
      attendees: undefined,
      _count: undefined,
    }));

    res.status(200).json(transformedEvents);
  } catch (error) {
    console.error("Error fetching user's events:", error);
    res.status(500).json({
      message: "Error fetching user's events",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Check-in an attendee
export const checkInAttendee = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { ticketCode, email, attendeeId } = req.body;
    const { eventId } = req.params;
    const userId = req.user.id;

    // Check permissions
    await checkEventPermissions(eventId, userId);

    if (!eventId) {
      res.status(400).json({ message: "Event ID is required" });
      return;
    }

    if (!ticketCode && !email && !attendeeId) {
      res
        .status(400)
        .json({ message: "Either ticket code, email, or attendee ID is required" });
      return;
    }

    // First verify the event exists and is a VENUE event
    const event = await prisma.event.findUnique({
      where: { eventId },
      select: {
        locationType: true,
        id: true,
      },
    });

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    if (event.locationType !== "VENUE") {
      res
        .status(400)
        .json({ message: "Check-in is only available for venue events" });
      return;
    }

    const currentDate = new Date().toISOString();

    // Check-in by attendee ID
    if (attendeeId) {
      const attendee = await prisma.eventAttendee.findFirst({
        where: {
          id: attendeeId,
          eventId,
          isApproved: true,
        },
      });

      if (!attendee) {
        res.status(404).json({ message: "Valid attendee not found" });
        return;
      }

      const updatedAttendee = await prisma.eventAttendee.update({
        where: {
          id: attendee.id,
        },
        data: {
          checkInDate: currentDate,
        },
        select: {
          user: {
            select: {
              fullName: true,
              email: true,
              profilePicture: true,
            },
          },
          ticketCode: true,
          checkInDate: true,
        },
      });

      res.json(updatedAttendee);
      return;
    }

    // Check-in by ticket code
    if (ticketCode) {
      const attendee = await prisma.eventAttendee.findFirst({
        where: {
          ticketCode,
          eventId,
          isApproved: true,
          ticketId: {
            not: null
          }
        },
      });

      if (!attendee) {
        res.status(404).json({ message: "Valid ticket not found" });
        return;
      }

      const updatedAttendee = await prisma.eventAttendee.update({
        where: {
          id: attendee.id,
        },
        data: {
          checkInDate: currentDate,
        },
        select: {
          user: {
            select: {
              fullName: true,
              email: true,
              profilePicture: true,
            },
          },
          ticketCode: true,
          checkInDate: true,
        },
      });

      res.json(updatedAttendee);
      return;
    }

    // Check-in by email
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const attendee = await prisma.eventAttendee.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId: user.id,
          },
        },
      });

      if (!attendee) {
        res
          .status(404)
          .json({ message: "User is not registered for this event" });
        return;
      }

      if (!attendee.isApproved) {
        res.status(400).json({ message: "Attendee is not approved" });
        return;
      }

      const updatedAttendee = await prisma.eventAttendee.update({
        where: {
          id: attendee.id,
        },
        data: {
          checkInDate: currentDate,
        },
        select: {
          user: {
            select: {
              fullName: true,
              email: true,
              profilePicture: true,
            },
          },
          ticketCode: true,
          checkInDate: true,
        },
      });

      res.json(updatedAttendee);
    }
  } catch (error) {
    console.error("Check-in error:", error);
    if (
      error instanceof Error &&
      error.message === "Unauthorized access to event"
    ) {
      res.status(403).json({ message: error.message });
      return;
    }
    res.status(500).json({
      message: "Error checking in attendee",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

export const getEventCheckIns = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // Check permissions
    await checkEventPermissions(eventId, userId);

    const checkIns = await prisma.eventAttendee.findMany({
      where: {
        eventId,
        checkInDate: {
          not: "Not checked in",
        },
      },
      select: {
        id: true,
        checkInDate: true,
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        checkInDate: "desc",
      },
    });

    res.status(200).json(checkIns);
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    if (
      error instanceof Error &&
      error.message === "Unauthorized access to event"
    ) {
      res.status(403).json({ message: error.message });
      return;
    }
    res.status(500).json({
      message: "Error fetching check-ins",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

export const uncheckInAttendee = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { ticketCode } = req.body;
    const { eventId } = req.params;
    const userId = req.user.id;

    // Check permissions
    await checkEventPermissions(eventId, userId);

    if (!eventId || !ticketCode) {
      res
        .status(400)
        .json({ message: "Event ID and ticket code are required" });
      return;
    }

    const attendee = await prisma.eventAttendee.findFirst({
      where: {
        ticketCode,
        eventId,
      },
    });

    if (!attendee) {
      res.status(404).json({ message: "Attendee not found" });
      return;
    }

    const updatedAttendee = await prisma.eventAttendee.update({
      where: {
        id: attendee.id,
      },
      data: {
        checkInDate: "Not checked in",
      },
      select: {
        user: {
          select: {
            fullName: true,
            email: true,
            profilePicture: true,
          },
        },
        ticketCode: true,
        checkInDate: true,
      },
    });

    res.json(updatedAttendee);
  } catch (error) {
    console.error("Uncheck-in error:", error);
    if (
      error instanceof Error &&
      error.message === "Unauthorized access to event"
    ) {
      res.status(403).json({ message: error.message });
      return;
    }
    res.status(500).json({
      message: "Error unchecking in attendee",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

export const getEventWithCounts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // Check permissions
    await checkEventPermissions(eventId, userId);

    const event = await prisma.event.findUnique({
      where: { eventId },
      select: {
        name: true,
        eventId: true,
        locationType: true,
        _count: {
          select: {
            attendees: {
              where: {
                isApproved: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    // Get count of checked-in attendees
    const checkedInCount = await prisma.eventAttendee.count({
      where: {
        eventId,
        isApproved: true,
        checkInDate: {
          not: "Not checked in",
        },
      },
    });

    res.json({
      name: event.name,
      eventId: event.eventId,
      totalAttendees: event._count.attendees,
      checkedInCount,
      locationType: event.locationType,
    });
  } catch (error) {
    console.error("Error fetching event counts:", error);
    if (
      error instanceof Error &&
      error.message === "Unauthorized access to event"
    ) {
      res.status(403).json({ message: error.message });
      return;
    }
    res.status(500).json({
      message: "Error fetching event counts",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

export const getEventAttendees = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // Check permissions
    await checkEventPermissions(eventId, userId);

    const event = await prisma.event.findUnique({
      where: { eventId },
      select: { requireApproval: true },
    });

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    const attendees = await prisma.eventAttendee.findMany({
      where: {
        eventId,
      },
      select: {
        id: true,
        isApproved: true,
        registrationDate: true,
        checkInDate: true,
        user: {
          select: {
            fullName: true,
            email: true,
            phoneNumber: true,
            profilePicture: true,
          },
        },
      },
      orderBy: {
        registrationDate: 'desc',
      },
    });

    const formattedAttendees = attendees.map(attendee => ({
      id: attendee.id,
      name: attendee.user.fullName || 'Anonymous',
      email: attendee.user.email,
      phone: attendee.user.phoneNumber,
      imageUrl: attendee.user.profilePicture,
      dateAdded: `${new Date(attendee.registrationDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}\n${new Date(attendee.registrationDate).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })}`,
      checkInTime: attendee.checkInDate === 'Not checked in' 
        ? null 
        : attendee.checkInDate ? `${new Date(attendee.checkInDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}\n${new Date(attendee.checkInDate).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}` : null,
      isApproved: attendee.isApproved,
    }));

    res.status(200).json({
      attendees: formattedAttendees,
      requiresApproval: event.requireApproval,
    });
  } catch (error) {
    console.error("Error fetching event attendees:", error);
    if (error instanceof Error && error.message === "Unauthorized access to event") {
      res.status(403).json({ message: error.message });
      return;
    }
    res.status(500).json({
      message: "Error fetching event attendees",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

export const uploadEventImage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const file = req.files?.image;

    if (!file) {
      res.status(400).json({ message: "No image file provided" });
      return;
    }

    // Add some console logs for debugging
    console.log("Received file:", {
      name: (file as any).name,
      size: (file as any).size,
      mimetype: (file as any).mimetype,
    });

    // First, ensure the bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const eventsBucket = buckets?.find((b) => b.name === "events");

    if (!eventsBucket) {
      console.error("Events bucket not found");
      res.status(500).json({ message: "Storage configuration error" });
      return;
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const fileExt = (file as any).name.split(".").pop();
    const fileName = `event-covers/${req.user.id}/${timestamp}.${fileExt}`;

    try {
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("events")
        .upload(fileName, (file as any).data, {
          contentType: (file as any).mimetype,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        throw error;
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("events").getPublicUrl(fileName);

      console.log("Generated public URL:", publicUrl);

      // Verify the file exists after upload
      const { data: fileExists } = await supabase.storage
        .from("events")
        .list(`event-covers/${req.user.id}`);

      console.log("Files in directory:", fileExists);

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

export const searchEvents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!query) {
      res.status(400).json({ message: "Search query is required" });
      return;
    }

    const [events, total] = await prisma.$transaction([
      prisma.event.findMany({
        where: {
          visibility: "PUBLIC",
          endDate: {
            gte: new Date().toISOString(),
          },
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        select: {
          eventId: true,
          coverImage: true,
          name: true,
          startDate: true,
          endDate: true,
          locationType: true,
          location: {
            select: {
              mainText: true,
            },
          },
        },
        orderBy: {
          startDate: "asc",
        },
        take: limit,
        skip: skip,
      }),
      prisma.event.count({
        where: {
          visibility: "PUBLIC",
          endDate: {
            gte: new Date().toISOString(),
          },
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              organizer: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },
      }),
    ]);

    res.status(200).json({
      events,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Server error in searchEvents:", error);
    res.status(500).json({
      message: "Error searching events",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

export const approveAttendees = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { attendeeIds } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(attendeeIds) || attendeeIds.length === 0) {
      res.status(400).json({ message: "No attendees specified for approval" });
      return;
    }

    // Check permissions
    await checkEventPermissions(eventId, userId);

    // Get event details to check if it's a venue event
    const event = await prisma.event.findUnique({
      where: { eventId },
      select: {
        locationType: true,
      },
    });

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    // For venue events, we need to generate tickets
    const shouldGenerateTickets = event.locationType === "VENUE";
    const { nanoid } = await import("nanoid");

    // Update all specified attendees
    const updatedAttendees = await prisma.$transaction(
      attendeeIds.map((attendeeId) =>
        prisma.eventAttendee.update({
          where: { id: attendeeId },
          data: {
            isApproved: true,
            ...(shouldGenerateTickets
              ? {
                  ticketId: randomUUID(),
                  ticketCode: nanoid(18),
                }
              : {}),
          },
          select: {
            id: true,
            isApproved: true,
            ticketCode: true,
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        })
      )
    );

    res.status(200).json({ attendees: updatedAttendees });
  } catch (error) {
    console.error("Error approving attendees:", error);
    if (error instanceof Error && error.message === "Unauthorized access to event") {
      res.status(403).json({ message: error.message });
      return;
    }
    res.status(500).json({
      message: "Error approving attendees",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

export const getAttendeeTicket = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { eventId, attendeeId } = req.params;
    const userId = req.user.id;

    // Check permissions
    await checkEventPermissions(eventId, userId);

    const attendee = await prisma.eventAttendee.findFirst({
      where: {
        id: attendeeId,
        eventId,
        isApproved: true,
      },
      select: {
        ticketCode: true,
        checkInDate: true,
      },
    });

    if (!attendee) {
      res.status(404).json({ message: "Attendee not found" });
      return;
    }

    res.json(attendee);
  } catch (error) {
    console.error("Error getting attendee ticket:", error);
    if (
      error instanceof Error &&
      error.message === "Unauthorized access to event"
    ) {
      res.status(403).json({ message: error.message });
      return;
    }
    res.status(500).json({
      message: "Error getting attendee ticket",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

export const removeAttendees = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { attendeeIds } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(attendeeIds) || attendeeIds.length === 0) {
      res.status(400).json({ message: "No attendees specified for removal" });
      return;
    }

    // Check permissions
    await checkEventPermissions(eventId, userId);

    // Remove all specified attendees
    await prisma.eventAttendee.deleteMany({
      where: {
        id: {
          in: attendeeIds
        },
        eventId
      }
    });

    res.status(200).json({ message: "Attendees removed successfully" });
  } catch (error) {
    console.error("Error removing attendees:", error);
    if (error instanceof Error && error.message === "Unauthorized access to event") {
      res.status(403).json({ message: error.message });
      return;
    }
    res.status(500).json({
      message: "Error removing attendees",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Add the addEventAttendee controller
export const addEventAttendee = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { userId: userToAddId } = req.body;
    const userId = req.user.id;


    const { nanoid } = await import("nanoid");

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get event details and check if user exists and is not already an attendee in one query
      const [event, user, existingAttendee] = await Promise.all([
        tx.event.findUnique({
          where: { eventId },
          select: { locationType: true, eventId: true }
        }),
        tx.user.findUnique({
          where: { id: userToAddId },
          select: { id: true }
        }),
        tx.eventAttendee.findUnique({
          where: {
            eventId_userId: {
              eventId,
              userId: userToAddId
            }
          },
          select: { id: true }
        })
      ]);

      if (!event) {
        throw new Error("Event not found");
      }

      await checkEventPermissions(eventId, userId);

      if (!user) {
        throw new Error("User not found");
      }

      if (existingAttendee) {
        throw new Error("User is already an attendee");
      }

      // Create attendee record
      return tx.eventAttendee.create({
        data: {
          eventId: event.eventId,
          userId: userToAddId,
          isApproved: true,
          ticketCode: event.locationType === "VENUE" ? nanoid(18) : null,
          ticketId: event.locationType === "VENUE" ? randomUUID() : null
        }
      });
    });

    res.status(201).json({ message: "Attendee added successfully", attendee: result });
  } catch (error) {
    console.error("Error adding attendee:", error);
    if (error instanceof Error) {
      switch (error.message) {
        case "Event not found":
          res.status(404).json({ message: error.message });
          break;
        case "User not found":
          res.status(404).json({ message: error.message });
          break;
        case "User is already an attendee":
          res.status(400).json({ message: error.message });
          break;
        default:
          res.status(500).json({ message: "Failed to add attendee" });
      }
    } else {
      res.status(500).json({ message: "Failed to add attendee" });
    }
  }
};
