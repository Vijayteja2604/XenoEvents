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
exports.addEventAttendee = exports.removeAttendees = exports.getAttendeeTicket = exports.approveAttendees = exports.searchEvents = exports.uploadEventImage = exports.getEventAttendees = exports.getEventWithCounts = exports.uncheckInAttendee = exports.getEventCheckIns = exports.checkInAttendee = exports.getUserEvents = exports.checkRegistrationStatus = exports.registerUserForEvent = exports.getUserEventRole = exports.getPublicEvents = exports.getEvent = exports.editEvent = exports.createEvent = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const crypto_1 = require("crypto");
const supabase_js_1 = require("@supabase/supabase-js");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const contactPersonSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().optional().nullable(),
});
const locationSchema = zod_1.z.object({
    placeId: zod_1.z.string().optional().nullable(),
    description: zod_1.z.string(),
    mainText: zod_1.z.string().optional().nullable(),
    secondaryText: zod_1.z.string().optional().nullable(),
    locationAdditionalDetails: zod_1.z.string().optional().nullable(),
    latitude: zod_1.z.number().optional().nullable(),
    longitude: zod_1.z.number().optional().nullable(),
    isCustom: zod_1.z.boolean().optional().default(false),
});
const createEventSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(1),
    description: zod_1.z
        .string()
        .min(1)
        .transform((str) => {
        try {
            return JSON.parse(str);
        }
        catch (_a) {
            // If it's not valid JSON, return a basic JSON structure
            return {
                type: "doc",
                content: [
                    { type: "paragraph", content: [{ type: "text", text: str }] },
                ],
            };
        }
    }),
    organizer: zod_1.z.string().min(1),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    locationType: zod_1.z.nativeEnum(client_1.LocationType),
    locationId: zod_1.z.string().optional(),
    location: locationSchema.optional(),
    meetingLink: zod_1.z.string().optional().nullable(),
    coverImage: zod_1.z.string().optional().nullable(),
    capacity: zod_1.z.number().int().positive().optional().nullable(),
    price: zod_1.z.number().min(0).optional().nullable(),
    priceType: zod_1.z.nativeEnum(client_1.PriceType).default("FREE"),
    visibility: zod_1.z.nativeEnum(client_1.VisibilityType).default("PUBLIC"),
    requireApproval: zod_1.z.boolean().default(false),
    websiteUrl: zod_1.z.string().optional().nullable(),
    contactPersons: zod_1.z.array(contactPersonSchema),
})
    .refine((data) => {
    if (data.locationType === "VENUE") {
        return !!data.locationId || !!data.location;
    }
    return true;
}, {
    message: "Location information is required for venue events",
});
// Add this helper function at the top of the file
const checkEventPermissions = (eventId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const eventTeamMember = yield prisma_1.default.eventTeam.findFirst({
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
});
// Create Event
const createEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customAlphabet } = yield import("nanoid");
        const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        const eventNanoId = customAlphabet(alphabet, 12);
        // Validate request body
        if (!req.body) {
            res.status(400).json({ message: "Request body is required" });
            return;
        }
        const validatedData = createEventSchema.parse(req.body);
        let locationId = null;
        // Only process location if it's a VENUE event
        if (validatedData.locationType === "VENUE") {
            if (validatedData.locationId) {
                const existingLocation = yield prisma_1.default.location.findUnique({
                    where: { id: validatedData.locationId },
                });
                if (!existingLocation) {
                    res.status(400).json({ message: "Invalid location ID" });
                    return;
                }
                locationId = validatedData.locationId;
            }
            else if (validatedData.location) {
                const newLocation = yield prisma_1.default.location.create({
                    data: validatedData.location,
                });
                locationId = newLocation.id;
            }
            else {
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
        const { location } = validatedData, eventData = __rest(validatedData, ["location"]);
        const event = yield prisma_1.default.event.create({
            data: Object.assign(Object.assign({ eventId: eventNanoId() }, eventData), { description: JSON.stringify(eventData.description), locationId: locationId, contactPersons: {
                    create: validatedData.contactPersons,
                }, team: {
                    create: {
                        userId: req.user.id,
                        role: "CREATOR",
                    },
                } }),
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
    }
    catch (error) {
        console.error("Server error in createEvent:", error);
        if (error instanceof zod_1.z.ZodError) {
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
});
exports.createEvent = createEvent;
// Edit Event
const editEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        const userId = req.user.id;
        // Check permissions
        yield checkEventPermissions(eventId, userId);
        // Validate request body
        if (!req.body) {
            res.status(400).json({ message: "Request body is required" });
            return;
        }
        const validatedData = createEventSchema.parse(req.body);
        let locationId = null;
        // Only process location if it's a VENUE event
        if (validatedData.locationType === "VENUE") {
            if (validatedData.locationId) {
                const existingLocation = yield prisma_1.default.location.findUnique({
                    where: { id: validatedData.locationId },
                });
                if (!existingLocation) {
                    res.status(400).json({ message: "Invalid location ID" });
                    return;
                }
                locationId = validatedData.locationId;
            }
            else if (validatedData.location) {
                // If the event already has a location, update it
                const event = yield prisma_1.default.event.findUnique({
                    where: { eventId },
                    select: { locationId: true },
                });
                if (event === null || event === void 0 ? void 0 : event.locationId) {
                    yield prisma_1.default.location.update({
                        where: { id: event.locationId },
                        data: validatedData.location,
                    });
                    locationId = event.locationId;
                }
                else {
                    // Create new location if none exists
                    const newLocation = yield prisma_1.default.location.create({
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
        const { location, contactPersons } = validatedData, eventData = __rest(validatedData, ["location", "contactPersons"]);
        // Get the original event to check its type and approval requirement
        const originalEvent = yield prisma_1.default.event.findUnique({
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
        let attendeeUpdates = [];
        // If changing from ONLINE to VENUE, create tickets for existing approved attendees
        if (originalEvent.locationType === "ONLINE" &&
            validatedData.locationType === "VENUE") {
            const { nanoid } = yield import("nanoid");
            // Add ticket updates for approved attendees without tickets
            attendeeUpdates.push(...originalEvent.attendees
                .filter((attendee) => attendee.isApproved)
                .map((attendee) => prisma_1.default.eventAttendee.update({
                where: { id: attendee.id },
                data: {
                    ticketId: (0, crypto_1.randomUUID)(),
                    ticketCode: nanoid(18),
                },
            })));
        }
        // If changing from requiring approval to not requiring approval
        if (originalEvent.requireApproval && !validatedData.requireApproval) {
            const { nanoid } = yield import("nanoid");
            // Add approval updates for unapproved attendees
            attendeeUpdates.push(...originalEvent.attendees
                .filter((attendee) => !attendee.isApproved)
                .map((attendee) => prisma_1.default.eventAttendee.update({
                where: { id: attendee.id },
                data: Object.assign({ isApproved: true }, (validatedData.locationType === "VENUE"
                    ? {
                        ticketId: (0, crypto_1.randomUUID)(),
                        ticketCode: nanoid(18),
                    }
                    : {})),
            })));
        }
        // Execute all attendee updates in parallel if there are any
        if (attendeeUpdates.length > 0) {
            yield prisma_1.default.$transaction(attendeeUpdates);
        }
        // Update the event
        const updatedEvent = yield prisma_1.default.event.update({
            where: { eventId },
            data: Object.assign(Object.assign({}, eventData), { description: JSON.stringify(eventData.description), locationId: locationId, 
                // Update contact persons
                contactPersons: {
                    deleteMany: {}, // Remove all existing contact persons
                    create: contactPersons, // Create new ones
                } }),
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
    }
    catch (error) {
        console.error("Server error in editEvent:", error);
        if (error instanceof zod_1.z.ZodError) {
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
});
exports.editEvent = editEvent;
// Get Event
const getEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId } = req.params;
    try {
        // Get event with attendee count
        const event = yield prisma_1.default.event.findUnique({
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
        const spotsLeft = event.capacity !== null ? event.capacity - event._count.attendees : null;
        // Remove _count from response and add spotsLeft
        const { _count } = event, eventData = __rest(event, ["_count"]);
        res.status(200).json(Object.assign(Object.assign({}, eventData), { capacity: event.capacity, spotsLeft: spotsLeft }));
    }
    catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({
            message: "Error fetching event",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.getEvent = getEvent;
// Get all Public Events
const getPublicEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const [events, total] = yield prisma_1.default.$transaction([
            prisma_1.default.event.findMany({
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
            prisma_1.default.event.count({
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
    }
    catch (error) {
        console.error("Server error in getPublicEvents:", error);
        res.status(500).json({
            message: "Error fetching public events",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.getPublicEvents = getPublicEvents;
// Check User's role for event
const getUserEventRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { eventId } = req.params;
        const userId = req.user.id;
        const event = yield prisma_1.default.event.findUnique({
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
        const userRole = ((_a = event.team[0]) === null || _a === void 0 ? void 0 : _a.role) || null;
        res.status(200).json({ role: userRole });
    }
    catch (error) {
        console.error("Error fetching user role:", error);
        res.status(500).json({
            message: "Error fetching user role",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.getUserEventRole = getUserEventRole;
// Register User for Event
const registerUserForEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        const userId = req.user.id;
        const { nanoid } = yield import("nanoid");
        const ticketCode = nanoid(18);
        const registerUser = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Check if user is already registered
            const existingRegistration = yield tx.eventAttendee.findUnique({
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
            const event = yield tx.event.findUniqueOrThrow({
                where: { eventId },
                select: {
                    requireApproval: true,
                    capacity: true,
                    locationType: true,
                },
            });
            // If capacity is set, check current attendee count
            if (event.capacity !== null) {
                const attendeeCount = yield tx.eventAttendee.count({
                    where: Object.assign({ eventId }, (event.requireApproval ? { isApproved: true } : {})),
                });
                if (attendeeCount >= event.capacity) {
                    throw new Error("EVENT_FULL");
                }
            }
            const isApproved = !event.requireApproval;
            // Only generate ticketCode for VENUE events
            const shouldCreateTicket = event.locationType === "VENUE" && isApproved;
            const attendee = yield tx.eventAttendee.create({
                data: {
                    eventId,
                    userId,
                    isApproved,
                    ticketId: shouldCreateTicket ? (0, crypto_1.randomUUID)() : null,
                    ticketCode: shouldCreateTicket ? ticketCode : null,
                },
                include: {
                    event: {
                        select: { requireApproval: true },
                    },
                },
            });
            return attendee;
        }));
        res.status(200).json(registerUser);
    }
    catch (error) {
        console.error("Error registering user for event:", error);
        if (typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2025") {
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
});
exports.registerUserForEvent = registerUserForEvent;
// Check if user is registered for event
const checkRegistrationStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        const userId = req.user.id;
        const registration = yield prisma_1.default.eventAttendee.findUnique({
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
    }
    catch (error) {
        console.error("Error checking registration status:", error);
        res.status(500).json({
            message: "Error checking registration status",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.checkRegistrationStatus = checkRegistrationStatus;
// Get User's Events (Created, Admin, and Registered)
const getUserEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const events = yield prisma_1.default.event.findMany({
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
        const transformedEvents = events.map((event) => {
            var _a;
            return (Object.assign(Object.assign({}, event), { 
                // Only include location data for VENUE events, meetingLink for ONLINE events
                location: event.locationType === "VENUE" ? event.location : null, meetingLink: event.locationType === "ONLINE" ? event.meetingLink : null, userRole: ((_a = event.team[0]) === null || _a === void 0 ? void 0 : _a.role) || null, registration: event.attendees[0] || null, approvedAttendeesCount: event._count.attendees, 
                // Clean up the nested arrays and counts we don't need anymore
                team: undefined, attendees: undefined, _count: undefined }));
        });
        res.status(200).json(transformedEvents);
    }
    catch (error) {
        console.error("Error fetching user's events:", error);
        res.status(500).json({
            message: "Error fetching user's events",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.getUserEvents = getUserEvents;
// Check-in an attendee
const checkInAttendee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ticketCode, email, attendeeId } = req.body;
        const { eventId } = req.params;
        const userId = req.user.id;
        // Check permissions
        yield checkEventPermissions(eventId, userId);
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
        const event = yield prisma_1.default.event.findUnique({
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
            const attendee = yield prisma_1.default.eventAttendee.findFirst({
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
            const updatedAttendee = yield prisma_1.default.eventAttendee.update({
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
            const attendee = yield prisma_1.default.eventAttendee.findFirst({
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
            const updatedAttendee = yield prisma_1.default.eventAttendee.update({
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
            const user = yield prisma_1.default.user.findUnique({
                where: { email },
                select: { id: true },
            });
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }
            const attendee = yield prisma_1.default.eventAttendee.findUnique({
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
            const updatedAttendee = yield prisma_1.default.eventAttendee.update({
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
    }
    catch (error) {
        console.error("Check-in error:", error);
        if (error instanceof Error &&
            error.message === "Unauthorized access to event") {
            res.status(403).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Error checking in attendee",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.checkInAttendee = checkInAttendee;
const getEventCheckIns = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        const userId = req.user.id;
        // Check permissions
        yield checkEventPermissions(eventId, userId);
        const checkIns = yield prisma_1.default.eventAttendee.findMany({
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
    }
    catch (error) {
        console.error("Error fetching check-ins:", error);
        if (error instanceof Error &&
            error.message === "Unauthorized access to event") {
            res.status(403).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Error fetching check-ins",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.getEventCheckIns = getEventCheckIns;
const uncheckInAttendee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ticketCode } = req.body;
        const { eventId } = req.params;
        const userId = req.user.id;
        // Check permissions
        yield checkEventPermissions(eventId, userId);
        if (!eventId || !ticketCode) {
            res
                .status(400)
                .json({ message: "Event ID and ticket code are required" });
            return;
        }
        const attendee = yield prisma_1.default.eventAttendee.findFirst({
            where: {
                ticketCode,
                eventId,
            },
        });
        if (!attendee) {
            res.status(404).json({ message: "Attendee not found" });
            return;
        }
        const updatedAttendee = yield prisma_1.default.eventAttendee.update({
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
    }
    catch (error) {
        console.error("Uncheck-in error:", error);
        if (error instanceof Error &&
            error.message === "Unauthorized access to event") {
            res.status(403).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Error unchecking in attendee",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.uncheckInAttendee = uncheckInAttendee;
const getEventWithCounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        const userId = req.user.id;
        // Check permissions
        yield checkEventPermissions(eventId, userId);
        const event = yield prisma_1.default.event.findUnique({
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
        const checkedInCount = yield prisma_1.default.eventAttendee.count({
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
    }
    catch (error) {
        console.error("Error fetching event counts:", error);
        if (error instanceof Error &&
            error.message === "Unauthorized access to event") {
            res.status(403).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Error fetching event counts",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.getEventWithCounts = getEventWithCounts;
const getEventAttendees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        const userId = req.user.id;
        // Check permissions
        yield checkEventPermissions(eventId, userId);
        const event = yield prisma_1.default.event.findUnique({
            where: { eventId },
            select: { requireApproval: true },
        });
        if (!event) {
            res.status(404).json({ message: "Event not found" });
            return;
        }
        const attendees = yield prisma_1.default.eventAttendee.findMany({
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
    }
    catch (error) {
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
});
exports.getEventAttendees = getEventAttendees;
const uploadEventImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const file = (_a = req.files) === null || _a === void 0 ? void 0 : _a.image;
        if (!file) {
            res.status(400).json({ message: "No image file provided" });
            return;
        }
        // Add some console logs for debugging
        console.log("Received file:", {
            name: file.name,
            size: file.size,
            mimetype: file.mimetype,
        });
        // First, ensure the bucket exists
        const { data: buckets } = yield supabase.storage.listBuckets();
        const eventsBucket = buckets === null || buckets === void 0 ? void 0 : buckets.find((b) => b.name === "events");
        if (!eventsBucket) {
            console.error("Events bucket not found");
            res.status(500).json({ message: "Storage configuration error" });
            return;
        }
        // Generate a unique filename
        const timestamp = Date.now();
        const fileExt = file.name.split(".").pop();
        const fileName = `event-covers/${req.user.id}/${timestamp}.${fileExt}`;
        try {
            // Upload to Supabase Storage
            const { data, error } = yield supabase.storage
                .from("events")
                .upload(fileName, file.data, {
                contentType: file.mimetype,
                cacheControl: "3600",
                upsert: false,
            });
            if (error) {
                console.error("Supabase upload error:", error);
                throw error;
            }
            // Get the public URL
            const { data: { publicUrl }, } = supabase.storage.from("events").getPublicUrl(fileName);
            console.log("Generated public URL:", publicUrl);
            // Verify the file exists after upload
            const { data: fileExists } = yield supabase.storage
                .from("events")
                .list(`event-covers/${req.user.id}`);
            console.log("Files in directory:", fileExists);
            res.status(200).json({ url: publicUrl });
        }
        catch (uploadError) {
            console.error("Upload error:", uploadError);
            res.status(500).json({
                message: "Error uploading to storage",
                error: uploadError instanceof Error ? uploadError.message : "Unknown error",
            });
        }
    }
    catch (error) {
        console.error("Error handling upload:", error);
        res.status(500).json({
            message: "Error uploading image",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.uploadEventImage = uploadEventImage;
const searchEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = req.query.q;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        if (!query) {
            res.status(400).json({ message: "Search query is required" });
            return;
        }
        const [events, total] = yield prisma_1.default.$transaction([
            prisma_1.default.event.findMany({
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
            prisma_1.default.event.count({
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
    }
    catch (error) {
        console.error("Server error in searchEvents:", error);
        res.status(500).json({
            message: "Error searching events",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.searchEvents = searchEvents;
const approveAttendees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        const { attendeeIds } = req.body;
        const userId = req.user.id;
        if (!Array.isArray(attendeeIds) || attendeeIds.length === 0) {
            res.status(400).json({ message: "No attendees specified for approval" });
            return;
        }
        // Check permissions
        yield checkEventPermissions(eventId, userId);
        // Get event details to check if it's a venue event
        const event = yield prisma_1.default.event.findUnique({
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
        const { nanoid } = yield import("nanoid");
        // Update all specified attendees
        const updatedAttendees = yield prisma_1.default.$transaction(attendeeIds.map((attendeeId) => prisma_1.default.eventAttendee.update({
            where: { id: attendeeId },
            data: Object.assign({ isApproved: true }, (shouldGenerateTickets
                ? {
                    ticketId: (0, crypto_1.randomUUID)(),
                    ticketCode: nanoid(18),
                }
                : {})),
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
        })));
        res.status(200).json({ attendees: updatedAttendees });
    }
    catch (error) {
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
});
exports.approveAttendees = approveAttendees;
const getAttendeeTicket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId, attendeeId } = req.params;
        const userId = req.user.id;
        // Check permissions
        yield checkEventPermissions(eventId, userId);
        const attendee = yield prisma_1.default.eventAttendee.findFirst({
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
    }
    catch (error) {
        console.error("Error getting attendee ticket:", error);
        if (error instanceof Error &&
            error.message === "Unauthorized access to event") {
            res.status(403).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Error getting attendee ticket",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.getAttendeeTicket = getAttendeeTicket;
const removeAttendees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        const { attendeeIds } = req.body;
        const userId = req.user.id;
        if (!Array.isArray(attendeeIds) || attendeeIds.length === 0) {
            res.status(400).json({ message: "No attendees specified for removal" });
            return;
        }
        // Check permissions
        yield checkEventPermissions(eventId, userId);
        // Remove all specified attendees
        yield prisma_1.default.eventAttendee.deleteMany({
            where: {
                id: {
                    in: attendeeIds
                },
                eventId
            }
        });
        res.status(200).json({ message: "Attendees removed successfully" });
    }
    catch (error) {
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
});
exports.removeAttendees = removeAttendees;
// Add the addEventAttendee controller
const addEventAttendee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        const { userId: userToAddId } = req.body;
        const userId = req.user.id;
        const { nanoid } = yield import("nanoid");
        // Use a transaction to ensure data consistency
        const result = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Get event details and check if user exists and is not already an attendee in one query
            const [event, user, existingAttendee] = yield Promise.all([
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
            yield checkEventPermissions(eventId, userId);
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
                    ticketId: event.locationType === "VENUE" ? (0, crypto_1.randomUUID)() : null
                }
            });
        }));
        res.status(201).json({ message: "Attendee added successfully", attendee: result });
    }
    catch (error) {
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
        }
        else {
            res.status(500).json({ message: "Failed to add attendee" });
        }
    }
});
exports.addEventAttendee = addEventAttendee;
