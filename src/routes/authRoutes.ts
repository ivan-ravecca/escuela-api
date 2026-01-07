import { Router, Request, Response } from "express";
import * as authController from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";
import { validate } from "../middleware/validateMiddleware";
import { loginSchema, verifyTokenSchema } from "../schemas";

const router = Router();
/**
 * @route   POST /api/auth/login
 * @desc    Login with Google token
 * @access  Public
 */
router.post("/login", validate(loginSchema), authController.login);
/**
 * @route   POST /api/auth/verify
 * @desc    Verify JWT token validity
 * @access  Public
 */
router.post("/verify", validate(verifyTokenSchema), authController.verifyToken);
/**
 * @route   GET /api/auth/me
 * @desc    Get current user information
 * @access  Private
 */
router.get("/me", authMiddleware, authController.getCurrentUser);

export default router;
