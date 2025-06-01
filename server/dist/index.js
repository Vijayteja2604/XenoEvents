"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
/* Route Imports */
const testRoutes_1 = __importDefault(require("./routes/testRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const eventRoutes_1 = __importDefault(require("./routes/eventRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const ticketRoutes_1 = __importDefault(require("./routes/ticketRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
/* Configurations */
dotenv_1.default.config();
const app = (0, express_1.default)();
// First, set up CORS options
const corsOptions = {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Cookie",
        "Cache-Control",
        "Pragma",
    ],
    exposedHeaders: ["set-cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
};
// Then apply CORS before other middleware
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
app.use(helmet_1.default.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use((0, morgan_1.default)("common"));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use((0, express_fileupload_1.default)({
    limits: { fileSize: 4 * 1024 * 1024 }, // 4MB limit
    abortOnLimit: true,
}));
/* Routes */
app.get("/", (req, res) => {
    res.send("This is home route");
});
app.use("/api/test", testRoutes_1.default);
app.use("/api/auth", authRoutes_1.default);
app.use("/api/event", eventRoutes_1.default);
app.use("/api/user", userRoutes_1.default);
app.use("/api/ticket", ticketRoutes_1.default);
app.use("/api/settings", settingsRoutes_1.default);
/* Server */
const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
