import { google } from "googleapis";
import { Readable } from "stream";
import { DriveFileResponse, DriveUploadResult } from "../types/index";

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
      scopes: ["https://www.googleapis.com/auth/drive"],
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

/**
 * Downloads a PDF file from Google Drive as a Buffer
 * @param fileId Google Drive file ID
 * @returns PDF file as Buffer
 */
export async function getDriveFileAsBuffer(fileId: string): Promise<Buffer> {
  try {
    const drive = await getDriveClientJWT();

    // Verificar que el archivo existe y es accesible
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: "name,mimeType",
    });

    // Comprobar que es un PDF
    if (fileMetadata.data.mimeType !== "application/pdf") {
      throw new Error("El archivo no es un PDF");
    }

    // Obtener el contenido del archivo
    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: "media",
      },
      { responseType: "arraybuffer" },
    );

    return Buffer.from(response.data as ArrayBuffer);
  } catch (error) {
    console.error("Error al descargar el archivo de Google Drive:", error);
    throw error;
  }
}

/**
 * Uploads a file to Drive or replaces an existing one with the same name.
 * Returns the file id and a webViewLink that can be shared.
 * @param fileName Name of the file
 * @param fileBuffer File content as Buffer
 * @param mimeType MIME type of the file
 * @param parentFolderId Optional parent folder ID where the file should be saved
 */
export async function uploadOrReplaceFile(
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string = "application/pdf",
  parentFolderId?: string,
): Promise<DriveUploadResult> {
  const drive = await getDriveClientJWT();

  // Build query to look for existing file with the same name
  let query = `name='${fileName.replace(/'/g, "\\'")}' and trashed=false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }

  const existingFiles = await drive.files.list({
    q: query,
    fields: "files(id,name,webViewLink)",
  });

  const existingFileId = existingFiles.data.files?.[0]?.id;
  const media = { mimeType, body: Readable.from(fileBuffer) };

  let fileId = existingFileId;

  if (fileId) {
    // Update existing file
    await drive.files.update({
      fileId,
      media,
      fields: "id,name,webViewLink",
    });
  } else {
    // Create new file
    const requestBody: any = { name: fileName };
    if (parentFolderId) {
      requestBody.parents = [parentFolderId];
    }
    const created = await drive.files.create({
      requestBody,
      media,
      fields: "id,name,webViewLink",
    });
    fileId = created.data.id as string;
  }

  // Ensure the file is shareable by anyone with the link
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
    fields: "id",
  });

  const { data } = await drive.files.get({
    fileId,
    fields: "id,name,webViewLink",
  });

  return {
    fileId,
    name: data.name || fileName,
    webViewLink: data.webViewLink || "",
  };
}
