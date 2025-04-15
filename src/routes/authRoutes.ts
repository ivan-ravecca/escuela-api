import express, { Request, Response } from "express";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { GoogleTokens } from "../types";

const router = express.Router();

// Configurar OAuth2
const oauth2Client: OAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

// Guardar tokens en memoria (para desarrollo)
// En producción, usa una base de datos
let tokens: GoogleTokens | null = null;

// Ruta para iniciar la autenticación
router.get("/google", (req: Request, res: Response) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.readonly"],
    prompt: "consent", // Para obtener siempre refresh_token
  });
  res.redirect(authUrl);
});

// Callback después de la autenticación
router.get(
  "/google/callback",
  async (req: express.Request, res: express.Response): Promise<void> => {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      res.status(400).send("Código de autorización faltante o inválido");
      return;
    }

    try {
      // Intercambiar código por tokens
      const { tokens: newTokens } = await oauth2Client.getToken(code);
      tokens = newTokens as GoogleTokens;

      // Guardar tokens para uso posterior
      oauth2Client.setCredentials(tokens);

      // En producción: guardar en base de datos
      console.log("Autenticación exitosa. Tokens obtenidos.");

      res.redirect("/auth/status");
    } catch (error) {
      console.error("Error en el callback de autenticación:", error);
      res.status(500).send("Error en la autenticación");
    }
  },
);

// Verificar estado de autenticación
router.get("/status", (req: Request, res: Response) => {
  if (tokens) {
    res.send(
      "Autenticado correctamente con Google Drive. La aplicación está lista para usar.",
    );
  } else {
    res.send(
      'No autenticado. <a href="/auth/google">Iniciar autenticación</a>',
    );
  }
});

// Función para obtener tokens actuales
function getTokens(): GoogleTokens | null {
  return tokens;
}

export { router, oauth2Client, getTokens };
