import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import emailRoutes from "./routes/email";
import cors from "cors";
import cookieParser from "cookie-parser";
import diplomaRoutes from "./routes/diploma";
import authRoutes from "./routes/authRoutes";
import assistantRoutes from "./routes/assistantRoutes";
import courseRoutes from "./routes/courseRoutes";
import config from "./config";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorMiddleware";
import { initializeDatabase } from "./database/connection";

const allowedOrigins = new Set(config.cors.allowedOrigins);

const corsOptions = {
  origin: function (origin: any, callback: any) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Content-Disposition",
    "X-CSRF-Token",
  ],
};

const PORT = config.server.port;

export const createApp = () => {
  const app = express();

  app.use(helmet()); // Seguridad
  app.use(morgan(config.server.nodeEnv === "development" ? "dev" : "combined"));
  app.use(cookieParser()); // Parse cookies for CSRF
  app.use(express.json());

  app.use(express.urlencoded({ extended: true }));
  app.options("*", cors(corsOptions));
  app.use(cors(corsOptions));
  app.use(bodyParser.json());

  app.use("/auth", authRoutes);
  app.use("/email", emailRoutes);
  app.use("/diploma", diplomaRoutes);
  app.use("/assistant", assistantRoutes);
  app.use("/courses", courseRoutes);

  app.get("/", (req, res) => {
    res.send("Hello World");
  });

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "success",
      message: "API is running",
      timestamp: new Date(),
    });
  });

  app.use(errorHandler);

  return app;
};

export const app = createApp();

// Initialize database and start server
export async function startServer() {
  try {
    await initializeDatabase();
    console.log("✅ Database initialized");

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export default app;
