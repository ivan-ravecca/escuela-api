import { Request, Response } from "express";
import * as authService from "../services/authService";
import config from "../config";

/**
 * Login with Google token
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { googleToken } = req.body;

    // Validation is handled by middleware, but keep as fallback
    if (!googleToken) {
      res.status(400).json({ message: "Token de Google no proporcionado" });
      return;
    }

    // Check if it's an ID token or Access token
    let userInfo;

    try {
      // Try as ID token first
      userInfo = await authService.verifyGoogleToken(googleToken);
    } catch (error) {
      // If it fails, try as access token
      try {
        userInfo = await authService.getUserInfoFromAccessToken(googleToken);
      } catch (innerError) {
        console.error("Error al procesar token de Google:", innerError);
        res.status(401).json({ message: "Token de Google inválido" });
        return;
      }
    }

    // Generate JWT token
    const token = authService.generateToken(userInfo);

    // Return the token to the client
    res.status(200).json({
      token,
      user: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      },
    });
    return;
  } catch (error: any) {
    console.error("Error en login:", error);
    res
      .status(500)
      .json({ message: error.message || "Error al procesar la solicitud" });
    return;
  }
};

/**
 * Verify a JWT token
 */
export const verifyToken = (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    // Validation is handled by middleware, but keep as fallback
    if (!token) {
      res.status(400).json({ message: "Token no proporcionado" });
      return;
    }

    // Verify the token
    const userInfo = authService.verifyToken(token);

    // Verify the user belongs to the allowed domain
    if (!userInfo.email.endsWith(`@${config.google.allowedDomain}`)) {
      res.status(403).json({
        valid: false,
        message: "Dominio de correo no autorizado",
      });
      return;
    }

    res.status(200).json({
      valid: true,
      user: userInfo,
    });
    return;
  } catch (error: any) {
    console.error("Error verifying token:", error);
    res.status(401).json({
      valid: false,
      message: error.message || "Token inválido o expirado",
    });
    return;
  }
};

/**
 * Get current user information
 */
export const getCurrentUser = (req: Request, res: Response) => {
  // The auth middleware has already verified the token and added the user to the request
  if (!req.user) {
    res.status(401).json({ message: "No autenticado" });
    return;
  }

  res.status(200).json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    picture: req.user.picture,
  });
  return;
};
