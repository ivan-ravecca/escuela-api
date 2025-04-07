import express from "express";
import bodyParser from "body-parser";
import emailRoutes from "./routes/email";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();
const corsOptions = {
  origin: /^https?:\/\/(.*\.)?escuelaenfermeria\.com\.uy(\/.*)?$/,
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
