"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ticketController_1 = require("../controllers/ticketController");
const router = (0, express_1.Router)();
router.get("/:ticketId", ticketController_1.getTicket);
router.get("/verify/:ticketCode", ticketController_1.verifyTicket);
exports.default = router;
