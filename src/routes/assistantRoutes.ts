import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AssistantController } from "../controllers/assistantController";
import { generateToken, validateRequest } from "../middleware/csrfMiddleware";

const router = Router();

// Rate limiter: max 10 requests per minute per IP
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    error: "Too many requests, please try again later.",
    retry_after: "1 minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for lead capture: max 3 submissions per hour per IP
const leadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: "Too many interest submissions, please try again later.",
    retry_after: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Get welcome message
router.get("/welcome", AssistantController.welcome);

// Get CSRF token
router.get("/csrf-token", (req, res) => {
  const token = generateToken(req, res);
  res.status(200).json({ csrfToken: token });
});

// Chat endpoint
router.post("/chat", chatLimiter, validateRequest, AssistantController.chat);

// Capture interest endpoint
router.post("/interest", leadLimiter, validateRequest, AssistantController.captureInterest);

export default router;
