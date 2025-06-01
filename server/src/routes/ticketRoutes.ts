import { Router } from "express";
import { getTicket, verifyTicket } from "../controllers/ticketController";

const router = Router();

router.get("/:ticketId", getTicket);
router.get("/verify/:ticketCode", verifyTicket);

export default router;
