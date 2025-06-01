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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventOverview = exports.deleteEvent = exports.removeAdmin = exports.addAdmin = exports.getEventMore = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Get event team members (creator and admins) (More)
const getEventMore = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        const { userId } = req.user;
        const isCreatorOrAdmin = yield prisma_1.default.eventTeam.findFirst({
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
        const eventTeam = yield prisma_1.default.eventTeam.findMany({
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
    }
    catch (error) {
        console.error("Error fetching event team:", error);
        res.status(500).json({
            message: "Error fetching event team",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.getEventMore = getEventMore;
// Add admin to event (More)
const addAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        const { userId } = req.body;
        // Validate request body
        if (!userId) {
            res.status(400).json({ message: "User ID is required" });
            return;
        }
        // Check if the requesting user is the creator
        const isCreator = yield prisma_1.default.eventTeam.findFirst({
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
        const existingTeamMember = yield prisma_1.default.eventTeam.findFirst({
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
        const newAdmin = yield prisma_1.default.eventTeam.create({
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
    }
    catch (error) {
        console.error("Error adding admin:", error);
        res.status(500).json({
            message: "Error adding admin",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.addAdmin = addAdmin;
// Remove admin from event (More)
const removeAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        const { userId } = req.body;
        // Validate request body
        if (!userId) {
            res.status(400).json({ message: "User ID is required" });
            return;
        }
        // Check if the requesting user is the creator
        const isCreator = yield prisma_1.default.eventTeam.findFirst({
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
        const adminToRemove = yield prisma_1.default.eventTeam.findFirst({
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
        yield prisma_1.default.eventTeam.delete({
            where: {
                id: adminToRemove.id,
            },
        });
        res.status(200).json({ message: "Admin removed successfully" });
    }
    catch (error) {
        console.error("Error removing admin:", error);
        res.status(500).json({
            message: "Error removing admin",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.removeAdmin = removeAdmin;
// Delete event (More)
const deleteEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        // Check if the requesting user is the creator
        const isCreator = yield prisma_1.default.eventTeam.findFirst({
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
        const event = yield prisma_1.default.event.findUnique({
            where: { eventId },
            select: { id: true, locationId: true },
        });
        if (!event) {
            res.status(404).json({ message: "Event not found" });
            return;
        }
        // Use transaction to ensure all related data is deleted
        yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Delete event attendees
            yield tx.eventAttendee.deleteMany({
                where: { eventId },
            });
            // Delete event team members
            yield tx.eventTeam.deleteMany({
                where: { eventId: event.id },
            });
            // Delete contact persons
            yield tx.contactPerson.deleteMany({
                where: { eventId: event.id },
            });
            // Delete the location if it exists
            if (event.locationId) {
                yield tx.location.delete({
                    where: { id: event.locationId },
                });
            }
            // Finally delete the event
            yield tx.event.delete({
                where: { eventId },
            });
        }));
        res.status(200).json({ message: "Event deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({
            message: "Error deleting event",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.deleteEvent = deleteEvent;
// Get event overview (Overview)
const getEventOverview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        const event = yield prisma_1.default.event.findUnique({
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
        const { team } = event, eventData = __rest(event, ["team"]);
        res.status(200).json(eventData);
    }
    catch (error) {
        console.error("Error fetching event overview:", error);
        res.status(500).json({
            message: "Error fetching event overview",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.getEventOverview = getEventOverview;
