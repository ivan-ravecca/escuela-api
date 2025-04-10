import express, { Request, Response, Router } from "express";
import { getDriveFile, extractFileIdFromUrl } from "../services/driveService";
import { createHash, verifyHash } from "../services/hashService";
import { generateQRCode } from "../services/qrService";

const router: Router = express.Router();

// Endpoint 1: Visualizar el PDF usando el hash
router.get(
  "/:diplomaId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const diplomaId: string = req.params.diplomaId;

      // Verificar y decodificar el hash para obtener el ID del archivo
      const fileId: string | null = verifyHash(diplomaId);

      if (!fileId || typeof fileId !== "string") {
        res.status(400).send("ID de diploma inválido");
        return;
      }

      // Obtener el archivo de Google Drive
      const file = await getDriveFile(fileId);

      // Configurar los encabezados para visualizar el PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="diploma.pdf"`);

      // Enviar el archivo como respuesta
      file.pipe(res);
    } catch (error) {
      console.error("Error al visualizar el diploma:", error);
      res.status(500).send("Error al procesar la solicitud");
    }
  },
);

// Endpoint 2: Generar código QR para un link de Google Drive
router.get("/generar", async (req: Request, res: Response): Promise<void> => {
  try {
    const driveUrl: string = req.query.link as string;

    if (!driveUrl) {
      res.status(400).send("Se requiere un link de Google Drive");
      return;
    }

    // Extraer el ID del archivo del link de Google Drive
    const fileId: string | null = extractFileIdFromUrl(driveUrl);

    if (!fileId || typeof fileId !== "string") {
      res.status(400).send("Link de Google Drive inválido");
      return;
    }

    // Crear un hash del ID del archivo
    const diplomaId: string | null = createHash(fileId as string);
    if (diplomaId === null) {
      console.error("Error al crear el hash");
      res.status(500).send("Error al crear el hash");
      return;
    }

    // Crear la URL completa para el Endpoint 1
    const diplomaUrl: string = `${process.env.BASE_URL}/diploma/${diplomaId}`;

    // Generar el código QR
    const qrImage: Buffer = await generateQRCode(diplomaUrl);

    // Devolver la imagen del código QR
    res.setHeader("Content-Type", "image/png");
    res.send(qrImage);
  } catch (error) {
    console.error("Error al generar el código QR:", error);
    res.status(500).send("Error al procesar la solicitud");
  }
});

export default router;
