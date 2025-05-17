import path from "path";
import express from "express";
import bodyParser from "body-parser";
import emailRoutes from "./routes/email";
import cors from "cors";
import diplomaRoutes from "./routes/diploma";
import authRoutes from "./routes/authRoutes";
import config from "./config";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorMiddleware";

const corsOptions = {
  origin: function (origin: any, callback: any) {
    const pattern = /^https?:\/\/(.*\.)?escuelaenfermeria\.com\.uy(\/.*)?$/;

    if (!origin || pattern.test(origin)) {
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
  ],
};

const app = express();
const PORT = config.server.port;

app.use(helmet()); // Seguridad
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.options("*", cors(corsOptions));
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Manejo de errores
app.use(errorHandler);

app.use("/auth", authRoutes);
app.use("/email", emailRoutes);
app.use("/diploma", diplomaRoutes);

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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
