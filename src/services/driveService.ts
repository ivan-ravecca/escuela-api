import { google } from "googleapis";
import { Readable } from "stream";
import { oauth2Client, getTokens } from "../routes/authRoutes";

/**
 * Extrae el ID del archivo de un link de Google Drive
 * @param url URL de Google Drive
 * @returns ID del archivo o null si no se encuentra
 */
export function extractFileIdFromUrl(url: string): string | null {
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
 * Obtiene un archivo de Google Drive como stream
 * @param fileId ID del archivo en Google Drive
 * @returns Stream del archivo
 */
export async function getDriveFile(fileId: string): Promise<Readable> {
  try {
    // Verificar si tenemos tokens
    const tokens = getTokens();
    if (!tokens) {
      throw new Error("No autenticado con Google Drive");
    }

    // Actualizar credenciales
    oauth2Client.setCredentials(tokens);

    const drive = google.drive({ version: "v3", auth: oauth2Client });

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

    return response.data as unknown as Readable;
  } catch (error) {
    console.error("Error al obtener el archivo de Google Drive:", error);
    throw error;
  }
}
