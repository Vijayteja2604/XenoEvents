import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  addAdmin,
  deleteEvent,
  getEventMore,
  getEventOverview,
  removeAdmin,
} from "../controllers/settingsController";

const router = Router();

router.get("/:eventId/overview", authMiddleware, getEventOverview);
// router.post("/:eventId/edit", authMiddleware, editEvent);
// router.get("/:eventId/attendees", authMiddleware, getEventAttendees);
// router.get("/:eventId/analytics", authMiddleware, getEventAnalytics);
router.get("/:eventId/more", authMiddleware, getEventMore);
router.post("/:eventId/more/addAdmin", authMiddleware, addAdmin);
router.post("/:eventId/more/removeAdmin", authMiddleware, removeAdmin);
router.post("/:eventId/more/deleteEvent", authMiddleware, deleteEvent);

export default router;
