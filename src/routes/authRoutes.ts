import { Router, Request, Response } from "express";
import * as authController from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();
/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión con token de Google
 * @access  Public
 */
router.post("/login", authController.login);
/**
 * @route   POST /api/auth/verify
 * @desc    Verificar validez de token JWT
 * @access  Public
 */
router.post("/verify", authController.verifyToken);
/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario actual
 * @access  Private
 */
router.get("/me", authMiddleware, authController.getCurrentUser);

export default router;
