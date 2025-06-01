import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";

/* Route Imports */
import testRoutes from "./routes/testRoutes";
import authRoutes from "./routes/authRoutes";
import eventRoutes from "./routes/eventRoutes";
import userRoutes from "./routes/userRoutes";
import ticketRoutes from "./routes/ticketRoutes";
import settingsRoutes from "./routes/settingsRoutes";

/* Configurations */
dotenv.config();

const app = express();

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
app.use(cors(corsOptions));

app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  fileUpload({
    limits: { fileSize: 4 * 1024 * 1024 }, // 4MB limit
    abortOnLimit: true,
  })
);

/* Routes */
app.get("/", (req, res) => {
  res.send("This is home route");
});

app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/event", eventRoutes);
app.use("/api/user", userRoutes);
app.use("/api/ticket", ticketRoutes);
app.use("/api/settings", settingsRoutes);

/* Server */
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
