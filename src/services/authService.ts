import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import config from "../config";

// Cliente de Google para verificación de tokens
const googleClient = new OAuth2Client(config.google.clientId);

interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

/**
 * Verifica un token de Google y retorna información del usuario
 */
export const verifyGoogleToken = async (token: string): Promise<UserInfo> => {
  try {
    // Verificar el token con Google
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: config.google.clientId,
    });

    // Obtener los datos del usuario
    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error("No se pudo obtener información del usuario");
    }

    // Verificar que el usuario pertenece al dominio permitido
    if (
      !payload.email ||
      !payload.email.endsWith(`@${config.google.allowedDomain}`)
    ) {
      throw new Error(
        `Solo usuarios de ${config.google.allowedDomain} pueden acceder`,
      );
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name || "",
      picture: payload.picture,
    };
  } catch (error) {
    console.error("Error al verificar token de Google:", error);
    throw new Error("Token de Google inválido o expirado");
  }
};

/**
 * Verifica un token de acceso de Google y obtiene información del usuario
 */
export const getUserInfoFromAccessToken = async (
  accessToken: string,
): Promise<UserInfo> => {
  try {
    // Usar el access_token para obtener información del usuario
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`,
    );

    if (!response.ok) {
      throw new Error("Error al obtener información del usuario");
    }

    const data = await response.json();

    // Verificar que el usuario pertenece al dominio permitido
    if (
      !data.email ||
      !data.email.endsWith(`@${config.google.allowedDomain}`)
    ) {
      throw new Error(
        `Solo usuarios de ${config.google.allowedDomain} pueden acceder`,
      );
    }

    return {
      id: data.sub,
      email: data.email,
      name: data.name || "",
      picture: data.picture,
    };
  } catch (error) {
    console.error("Error al obtener información del usuario:", error);
    throw error;
  }
};

/**
 * Genera un token JWT para el usuario
 */
export const generateToken = (user: UserInfo): string => {
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
  };

  if (!config.jwt.secret) {
    throw new Error("JWT secret is not defined");
  }

  return jwt.sign(payload, config.jwt.secret as any, {
    expiresIn: config.jwt.expiration as any,
  });
};

/**
 * Verifica un token JWT y retorna los datos del usuario
 */
export const verifyToken = (token: string): UserInfo => {
  try {
    if (!config.jwt.secret) {
      throw new Error("JWT secret is not defined");
    }

    const decoded = jwt.verify(token, config.jwt.secret as string) as any;

    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    };
  } catch (error) {
    console.error(error);
    throw new Error("Token inválido o expirado");
  }
};
