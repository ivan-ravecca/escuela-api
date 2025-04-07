import winston from "winston";
import path from "path";
import express from "express";
import bodyParser from "body-parser";
import emailRoutes from "./routes/email";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  defaultMeta: { service: "escuela-api" },
  transports: [
    // Write to logs directory
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/combined.log"),
    }),
    // Also log to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});
logger.info("perepepep");
const corsOptions = {
  origin: function (origin: any, callback: any) {
    logger.info(`Received request with origin: "${origin}"`);

    const pattern = /^https?:\/\/(.*\.)?escuelaenfermeria\.com\.uy(\/.*)?$/;

    if (!origin || pattern.test(origin)) {
      logger.info(`Origin "${origin}" is allowed`);
      callback(null, true);
    } else {
      logger.info(`Origin "${origin}" is NOT allowed`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

const app = express();
const PORT = process.env.PORT || 3000;

app.options("*", cors(corsOptions));
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use("/email", emailRoutes);
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
