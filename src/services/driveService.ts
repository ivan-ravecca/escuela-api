import { google } from "googleapis";
import { Readable } from "stream";
import { DriveFileResponse } from "../types/index";

import fs from "fs";
import path from "path";
const KEY_FILE_PATH = path.join(
  __dirname,
  "../../keys/service-account-key.json",
);

export class AuthenticationRequiredError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthenticationRequiredError";
  }
}

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
    //console.error("Error al extraer el ID del archivo:", error);
    return null;
  }
}

/**
 * Creates an authenticated Google Drive client using JWT
 * @returns Authenticated Google Drive client
 */
async function getDriveClientJWT(): Promise<any> {
  try {
    // Create JWT client using service account
    const authGoogle = new google.auth.GoogleAuth({
      keyFile: KEY_FILE_PATH,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    const authClient = await authGoogle.getClient();
    return google.drive({ version: "v3", auth: authClient as any });
  } catch (error) {
    //console.error("Failed to create Drive client:", error);
    throw error;
  }
}

export async function getDriveFileJWT(
  fileId: string,
): Promise<DriveFileResponse> {
  //console.log(`Obteniendo archivo de Google Drive con ID: ${fileId}`);
  try {
    // Get authenticated client
    const drive = await getDriveClientJWT();

    // Verificar que el archivo existe y es accesible
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: "name,mimeType",
    });

    // Comprobar que es un PDF
    if (fileMetadata.data.mimeType !== "application/pdf") {
      //console.log(`El archivo no es un PDF`);
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
    //console.log(`>>>> Devolviendo el archivo ${fileMetadata.data.name}`);
    // Return both the stream and the file metadata
    return {
      stream: response.data as Readable,
      metadata: {
        name: fileMetadata.data.name,
        mimeType: fileMetadata.data.mimeType,
      },
    };
  } catch (error) {
    //console.error("Error al obtener el archivo de Google Drive:", error);
    throw error;
  }
}
