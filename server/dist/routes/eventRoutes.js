"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const eventController_1 = require("../controllers/eventController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post("/create", auth_1.authMiddleware, eventController_1.createEvent); // Create an event
router.patch("/:eventId/edit", auth_1.authMiddleware, eventController_1.editEvent); // Edit an event
router.get("/events", eventController_1.getPublicEvents); // Get all public events in /explore page
router.get("/search", eventController_1.searchEvents);
router.get("/user-events", auth_1.authMiddleware, eventController_1.getUserEvents); // Get all of user's events where user is CREATOR, ADMIN, or an attendee
router.get("/:eventId", eventController_1.getEvent); // Get an event
router.get("/:eventId/userRole", auth_1.authMiddleware, eventController_1.getUserEventRole); // Get user's role for an event
router.post("/:eventId/register", auth_1.authMiddleware, eventController_1.registerUserForEvent); // Register user for an event
router.get("/:eventId/registration-status", auth_1.authMiddleware, eventController_1.checkRegistrationStatus); // Check if user is registered for an event
router.post("/:eventId/check-in", auth_1.authMiddleware, eventController_1.checkInAttendee); // Check-in an attendee
router.get("/:eventId/check-ins", auth_1.authMiddleware, eventController_1.getEventCheckIns);
router.post("/:eventId/uncheck-in", auth_1.authMiddleware, eventController_1.uncheckInAttendee);
router.get("/:eventId/counts", auth_1.authMiddleware, eventController_1.getEventWithCounts);
router.get("/:eventId/attendees", auth_1.authMiddleware, eventController_1.getEventAttendees);
router.post("/:eventId/attendees/add", auth_1.authMiddleware, eventController_1.addEventAttendee);
router.get("/:eventId/attendee/:attendeeId/ticket", auth_1.authMiddleware, eventController_1.getAttendeeTicket);
router.post("/:eventId/approve-attendees", auth_1.authMiddleware, eventController_1.approveAttendees);
router.post("/:eventId/remove-attendees", auth_1.authMiddleware, eventController_1.removeAttendees);
router.post("/upload-image", auth_1.authMiddleware, eventController_1.uploadEventImage);
exports.default = router;
