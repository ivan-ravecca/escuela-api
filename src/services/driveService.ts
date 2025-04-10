import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";

// Define types
interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
}

// Configurar OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

/**
 * Esta función debería ser llamada después de autenticar al usuario
 * Para simplificar, aquí se incluiría el token de acceso directamente
 * En una aplicación real, este token debería obtenerse del proceso de OAuth
 * y almacenarse de forma segura (por ejemplo, en una base de datos)
 */
function setCredentials(tokens: OAuthTokens): void {
  oauth2Client.setCredentials(tokens);
}

/**
 * Extraer el ID del archivo de un link de Google Drive
 */
function extractFileIdFromUrl(url: string): string | null {
  try {
    const regex = /\/file\/d\/([^\/]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Error al extraer el ID del archivo:", error);
    return null;
  }
}

/**
 * Obtener un archivo de Google Drive
 */
async function getDriveFile(fileId: string): Promise<Readable> {
  try {
    const drive: drive_v3.Drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    // Verificar que el archivo existe y es accesible
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: "name,mimeType",
    });

    // Comprobar que es un PDF
    if (fileMetadata.data.mimeType !== "application/pdf") {
      throw new Error("El archivo no es un PDF");
    }

    // Obtener el contenido del archivo como un stream
    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: "media",
      },
      { responseType: "stream" },
    );

    return response.data as Readable;
  } catch (error) {
    console.error("Error al obtener el archivo de Google Drive:", error);
    throw error;
  }
}

export { setCredentials, getDriveFile, extractFileIdFromUrl };
