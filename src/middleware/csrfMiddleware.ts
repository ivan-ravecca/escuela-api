import { doubleCsrf } from "csrf-csrf";
import { Request, Response, NextFunction } from "express";
import config from "../config";

// Configure CSRF protection
const csrfProtection = doubleCsrf({
  getSecret: () => config.crypto.csrfSecret || "default-csrf-secret-change-me",
  cookieName: config.server.nodeEnv === "production" ? "__Host-escuela.csrf-token" : "escuela.csrf-token",
  cookieOptions: {
    sameSite: "lax",
    path: "/",
    secure: config.server.nodeEnv === "production",
    httpOnly: true,
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getSessionIdentifier: (req: Request) => {
    // Use IP address as session identifier for stateless CSRF
    return req.ip || req.socket.remoteAddress || "unknown";
  },
  getCsrfTokenFromRequest: (req: Request) => {
    return req.headers["x-csrf-token"] as string;
  },
});

// Wrapper function for generating tokens
const generateToken = (req: Request, res: Response): string => {
  return csrfProtection.generateCsrfToken(req, res);
};

// Express middleware wrapper for CSRF validation with better error handling
const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  csrfProtection.doubleCsrfProtection(req, res, (error?: any) => {
    if (error) {
      console.error("CSRF validation error:", error);
      res.status(403).json({ 
        error: "Token CSRF inválido o ausente. Por favor, recarga la página e intenta nuevamente.",
        code: "INVALID_CSRF_TOKEN"
      });
      return;
    }
    next();
  });
};

export { generateToken, validateRequest };
