import path from "path";
import express from "express";
import bodyParser from "body-parser";
import emailRoutes from "./routes/email";
import dotenv from "dotenv";
import cors from "cors";
import diplomaRoutes from "./routes/diploma";
dotenv.config();

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
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

const app = express();
const PORT = process.env.PORT || 3000;

app.options("*", cors(corsOptions));
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use("/email", emailRoutes);
app.use("/diploma", diplomaRoutes);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
