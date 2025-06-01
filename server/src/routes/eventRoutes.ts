import { Router } from "express";
import {
  createEvent,
  getEvent,
  getPublicEvents,
  getUserEventRole,
  registerUserForEvent,
  checkRegistrationStatus,
  getUserEvents,
  checkInAttendee,
  getEventCheckIns,
  uncheckInAttendee,
  getEventWithCounts,
  getEventAttendees,
  uploadEventImage,
  searchEvents,
  editEvent,
  approveAttendees,
  getAttendeeTicket,
  removeAttendees,
  addEventAttendee,
} from "../controllers/eventController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/create", authMiddleware, createEvent); // Create an event
router.patch("/:eventId/edit", authMiddleware, editEvent); // Edit an event
router.get("/events", getPublicEvents); // Get all public events in /explore page
router.get("/search", searchEvents);
router.get("/user-events", authMiddleware, getUserEvents); // Get all of user's events where user is CREATOR, ADMIN, or an attendee
router.get("/:eventId", getEvent); // Get an event
router.get("/:eventId/userRole", authMiddleware, getUserEventRole); // Get user's role for an event
router.post("/:eventId/register", authMiddleware, registerUserForEvent); // Register user for an event
router.get(
  "/:eventId/registration-status",
  authMiddleware,
  checkRegistrationStatus
); // Check if user is registered for an event
router.post("/:eventId/check-in", authMiddleware, checkInAttendee); // Check-in an attendee
router.get("/:eventId/check-ins", authMiddleware, getEventCheckIns);
router.post("/:eventId/uncheck-in", authMiddleware, uncheckInAttendee);
router.get("/:eventId/counts", authMiddleware, getEventWithCounts);
router.get("/:eventId/attendees", authMiddleware, getEventAttendees);
router.post("/:eventId/attendees/add", authMiddleware, addEventAttendee);
router.get("/:eventId/attendee/:attendeeId/ticket", authMiddleware, getAttendeeTicket);
router.post("/:eventId/approve-attendees", authMiddleware, approveAttendees);
router.post("/:eventId/remove-attendees", authMiddleware, removeAttendees);
router.post("/upload-image", authMiddleware, uploadEventImage);

export default router;
