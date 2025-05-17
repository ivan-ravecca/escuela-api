import { Request, Response } from "express";
import * as authService from "../services/authService";

/**
 * Inicia sesión con token de Google
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { googleToken } = req.body;

    if (!googleToken) {
      res.status(400).json({ message: "Token de Google no proporcionado" });
      return;
    }

    // Verificar si es un ID token o Access token
    let userInfo;

    try {
      // Intentar como ID token primero
      userInfo = await authService.verifyGoogleToken(googleToken);
    } catch (error) {
      // Si falla, intentar como access token
      try {
        userInfo = await authService.getUserInfoFromAccessToken(googleToken);
      } catch (innerError) {
        console.error("Error al procesar token de Google:", innerError);
        res.status(401).json({ message: "Token de Google inválido" });
        return;
      }
    }

    // Generar token JWT
    const token = authService.generateToken(userInfo);

    // Devolver el token al cliente
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
 * Verifica un token JWT
 */
export const verifyToken = (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ message: "Token no proporcionado" });
      return;
    }

    // Verificar el token
    const userInfo = authService.verifyToken(token);

    // Verificar que el usuario pertenece al dominio permitido
    if (!userInfo.email.endsWith(`@${process.env.ALLOWED_DOMAIN}`)) {
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
    console.error("Error al verificar token:", error);
    res.status(401).json({
      valid: false,
      message: error.message || "Token inválido o expirado",
    });
    return;
  }
};

/**
 * Obtiene información del usuario actual
 */
export const getCurrentUser = (req: Request, res: Response) => {
  // El middleware de autenticación ya ha verificado el token y agregado el usuario al request
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
