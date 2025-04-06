import express from "express";
import bodyParser from "body-parser";
import emailRoutes from "./routes/email";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();
interface CorsOptions {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => void;
  credentials: boolean;
}

const corsOptions: CorsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ): void {
    const allowedOrigins: RegExp[] = [
      /^https?:\/\/(.*\.)?escuelaenfermeria\.com\.uy$/,
    ];

    if (!origin) {
      return callback(null, true); // allow non-browser clients like curl, Postman, etc.
    }

    const isAllowed: boolean = allowedOrigins.some((pattern: RegExp) =>
      pattern.test(origin),
    );
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use("/email", emailRoutes);
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
