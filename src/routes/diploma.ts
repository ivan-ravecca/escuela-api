import express, { Request, Response, Router } from "express";
import {
  getDriveFileJWT,
  extractFileIdFromUrl,
  AuthenticationRequiredError,
} from "../services/driveService";
import { createHash, verifyHash } from "../services/hashService";
import { generateQRCode } from "../services/qrService";
import { fillPDFTemplate } from "../services/pdfTemplateService";
import { authMiddleware } from "../middleware/authMiddleware";
import config from "../config";

const path = require("path");

const processGenerationOfQR = async (fileId: string): Promise<Buffer> => {
  // Crear un hash del ID del archivo
  const diplomaId: string | null = createHash(fileId as string);
  if (diplomaId === null) {
    console.error("Error al crear el hash");
    throw new Error("Error al crear el hash");
  }

  // Crear la URL completa para el Endpoint 1
  const diplomaUrl: string = `${config.cors.siteUrl}/diploma/${diplomaId}`;
  console.log(`URL del diploma: ${diplomaUrl}`);

  // Generar el código QR
  return await generateQRCode(diplomaUrl);
};

const router: Router = express.Router();

router.get("/", (req: Request, res: Response) => {
  res.send("You cannot GET diploma");
});

// Endpoint 2: Generar código QR para un link de Google Drive
router.get(
  "/generate",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
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

      const qrImage: Buffer = await processGenerationOfQR(fileId);

      // Devolver la imagen del código QR
      res.setHeader("Content-Type", "image/png");
      res.send(qrImage);
    } catch (error) {
      console.error("Error al generar el código QR:", error);
      res.status(500).send("Error al procesar la solicitud");
    }
  },
);

// Endpoint 1: Visualizar el PDF usando el hash
router.get(
  "/:diplomaId",
  async (req: Request, res: Response): Promise<void> => {
    const diplomaId: string = req.params.diplomaId;
    console.log(`ID del diploma: ${diplomaId}`);
    try {
      // Verificar y decodificar el hash para obtener el ID del archivo
      const fileId: string | null = verifyHash(diplomaId);

      if (!fileId) {
        console.log(`diploma Invalid: ${diplomaId}`);
        res.status(400).send("ID de diploma inválido");
        return;
      }

      // Obtener el archivo de Google Drive
      //const file = await getDriveFile(fileId);
      const file = await getDriveFileJWT(fileId);

      // Get the filename and clean it up if needed
      let fileName = file.metadata.name;
      // If filename doesn't end with .pdf, add it
      if (!fileName.toLowerCase().endsWith(".pdf")) {
        fileName = encodeURIComponent(fileName.replace(/[^\w\s.-]/g, "_"));
        fileName = `${fileName}.pdf`;
      }

      // Configurar los encabezados para visualizar el PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Access-Control-Expose-Headers", "content-disposition");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${fileName}"; filename*=UTF-8''${fileName}`,
      );

      // Enviar el archivo como respuesta
      file.stream.pipe(res);
    } catch (error) {
      console.error("1 - Error al obtener el archivo:", error);
      // Check if authentication is required
      if (error instanceof AuthenticationRequiredError) {
        // Store the diploma ID in the session or as a URL parameter
        const returnUrl = `/diploma/${diplomaId}`;
        const encodedReturnUrl = encodeURIComponent(returnUrl);
        console.error("2 - Guardo el redirect URL", encodedReturnUrl);

        // Redirect to Google authentication with return URL
        res.redirect(`/auth/google?returnUrl=${encodedReturnUrl}`);
      } else {
        console.error("Error al visualizar el diploma:", error);
        res.status(500).send("Error al procesar la solicitud");
      }
    }
  },
);

router.post("/certificate", authMiddleware, async (req, res) => {
  const { studentName, courseName, courseDate, driveUrl } = req.body;
  const templatePath = path.resolve(
    __dirname,
    "../../src/templates/certificate.pdf",
  );
  console.log(
    `studentName: ${studentName}, courseName: ${courseName}, courseDate: ${courseDate}, driveUrl: ${driveUrl}`,
  );
  try {
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

    const qrImage: Buffer = await processGenerationOfQR(fileId);

    // Convert the QR buffer to base64 string for the template
    const qrImageBase64 = qrImage.toString("base64");

    // Get PDF buffer instead of file path
    const pdfBuffer = await fillPDFTemplate(templatePath, {
      studentName,
      courseName,
      courseDate,
      qrImageBase64: qrImageBase64,
    });

    // Set headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="certificado-${studentName || "sin-nombre"}.pdf"`,
    );

    // Send the buffer directly
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error(`Error al llenar el PDF: ${error.message}`, error);
    res.status(500).send("Error al generar el certificado");
  }
});
export default router;
