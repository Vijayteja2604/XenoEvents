import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const getTicket = async (req: Request, res: Response): Promise<void> => {
  const { ticketId } = req.params;

  const ticket = await prisma.eventAttendee.findUnique({
    where: { ticketId },
    select: {
      ticketCode: true,
      event: {
        select: {
          eventId: true,
          name: true,
          startDate: true,
          endDate: true,
          location: {
            select: {
              mainText: true,
            },
          },
        },
      },
      user: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  });
  res.json(ticket);
};

export const verifyTicket = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { ticketCode } = req.params;

    const attendee = await prisma.eventAttendee.findFirst({
      where: {
        ticketCode,
        isApproved: true,
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            profilePicture: true,
          },
        },
        event: {
          select: {
            eventId: true,
          },
        },
      },
    });

    if (!attendee) {
      res.status(404).json({
        valid: false,
        message: "Invalid ticket",
      });
      return;
    }

    const isCheckedIn =
      attendee.checkInDate !== "Not checked in" &&
      attendee.checkInDate !== null &&
      !isNaN(new Date(attendee.checkInDate).getTime());

    res.status(200).json({
      valid: true,
      user: attendee.user,
      eventId: attendee.event.eventId,
      isCheckedIn,
      ...(isCheckedIn && { checkInDate: attendee.checkInDate }),
    });
  } catch (error) {
    console.error("Error verifying ticket:", error);
    res.status(500).json({
      valid: false,
      message: "Error verifying ticket",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
