import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";

// Extender el tipo Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        picture?: string;
      };
    }
  }
}

/**
 * Middleware para verificar el token JWT y proteger rutas
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Obtener el token del header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res
      .status(401)
      .json({ message: "No se proporcionó token de autenticación" });
    return;
  }

  try {
    // Verificar el token
    if (!config.jwt.secret) {
      throw new Error("JWT secret is not defined");
    }
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    // Verificar que el usuario pertenece al dominio permitido
    if (!decoded.email.endsWith(`@${config.google.allowedDomain}`)) {
      res.status(403).json({ message: "Dominio de correo no autorizado" });
      return;
    }

    // Agregar el usuario al request para uso posterior
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Token inválido o expirado" });
    return;
  }
};

/**
 * Middleware para verificar que el usuario pertenece al dominio permitido
 */
export const domainMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || !req.user.email) {
    res.status(401).json({ message: "Usuario no autenticado" });
    return;
  }

  if (!req.user.email.endsWith(`@${config.google.allowedDomain}`)) {
    res.status(403).json({
      message: `Solo usuarios de ${config.google.allowedDomain} pueden acceder`,
    });
    return;
  }

  next();
};
