import express, { Request, Response, Router } from "express";
import {
  getDriveFileJWT,
  extractFileIdFromUrl,
  AuthenticationRequiredError,
  uploadOrReplaceFile,
  getDriveFileAsBuffer,
} from "../services/driveService";
import { createHash, verifyHash } from "../services/hashService";
import { generateQRCode } from "../services/qrService";
import { fillPDFTemplate, combinePDFs } from "../services/pdfTemplateService";
import { authMiddleware } from "../middleware/authMiddleware";
import config from "../config";
import { PROGRAM_DRIVE_LINKS, type ProgramOption } from "../config/programOptions";

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
  const {
    studentName,
    courseName,
    courseDate,
    certMec,
    programOption,
  } = req.body;

  const baseTemplatePath = path.resolve(
    __dirname,
    "../../src/templates/certificate.pdf",
  );
  const templateMECPath = path.resolve(
    __dirname,
    "../../src/templates/certificate_MEC.pdf",
  );

  const templatePathToUse = certMec ? templateMECPath : baseTemplatePath;
  const certificateFileName = `Certificado ${
    studentName || "sin-nombre"
  } - ${courseName || "sin-curso"} - ${courseDate || "sin-fecha"}.pdf`;

  // If no programOption, it's a course certificate; otherwise it's a program certificate
  const isCourseCert = !programOption;

  let qrImageBase64: string | undefined;
  let pdfBuffer: Buffer = null as any;

  try {
    if (isCourseCert) {
      if (certMec) {
        // MEC flow: no QR generation, just create and upload once
        pdfBuffer = await fillPDFTemplate(templatePathToUse, {
          studentName,
          courseName,
          courseDate,
        });

        await uploadOrReplaceFile(
          certificateFileName,
          pdfBuffer,
          "application/pdf",
          config.drive.folderId,
        );
      } else {
        // Non-MEC course flow: two-step to get Drive link, then QR via hashed URL
        const initialPdfBuffer = await fillPDFTemplate(templatePathToUse, {
          studentName,
          courseName,
          courseDate,
        });

        const initialUpload = await uploadOrReplaceFile(
          certificateFileName,
          initialPdfBuffer,
          "application/pdf",
          config.drive.folderId,
        );

        if (!initialUpload.webViewLink) {
          res
            .status(500)
            .send("No se pudo obtener el enlace compartido de Google Drive");
          return;
        }

        const uploadedFileId = extractFileIdFromUrl(initialUpload.webViewLink);
        if (!uploadedFileId) {
          res
            .status(500)
            .send(
              "No se pudo extraer el ID del archivo de Google Drive del enlace compartido",
            );
          return;
        }

        const qrImage: Buffer = await processGenerationOfQR(uploadedFileId);
        qrImageBase64 = qrImage.toString("base64");

        pdfBuffer = await fillPDFTemplate(templatePathToUse, {
          studentName,
          courseName,
          courseDate,
          qrImageBase64,
        });

        await uploadOrReplaceFile(
          certificateFileName,
          pdfBuffer,
          "application/pdf",
          config.drive.folderId,
        );
      }
    } else if (programOption) {
      if (certMec) {
        // MEC flow with program: no QR generation, just create and upload once
        pdfBuffer = await fillPDFTemplate(templatePathToUse, {
          studentName,
          courseName,
          courseDate,
        });

        await uploadOrReplaceFile(
          certificateFileName,
          pdfBuffer,
          "application/pdf",
          config.drive.folderId,
        );
      } else {
        // Program without MEC: New flow
        // 1. Generate initial certificate and upload to Drive
        const initialPdfBuffer = await fillPDFTemplate(templatePathToUse, {
          studentName,
          courseName,
          courseDate,
        });

        const initialUpload = await uploadOrReplaceFile(
          certificateFileName,
          initialPdfBuffer,
          "application/pdf",
          config.drive.folderId,
        );

        if (!initialUpload.webViewLink) {
          res
            .status(500)
            .send("No se pudo obtener el enlace compartido de Google Drive");
          return;
        }

        // 2. Generate QR pointing to "Certificado A"
        const uploadedFileId = extractFileIdFromUrl(initialUpload.webViewLink);
        if (!uploadedFileId) {
          res
            .status(500)
            .send(
              "No se pudo extraer el ID del archivo de Google Drive del enlace compartido",
            );
          return;
        }

        const qrImage: Buffer = await processGenerationOfQR(uploadedFileId);
        qrImageBase64 = qrImage.toString("base64");

        // 3. Get program PDF from Drive
        const selectedProgram = programOption as ProgramOption;
        const programDriveUrl = PROGRAM_DRIVE_LINKS[selectedProgram];

        if (!programDriveUrl) {
          res
            .status(400)
            .send("Programa inválido: opción seleccionada no configurada");
          return;
        }

        const programFileId: string | null = extractFileIdFromUrl(programDriveUrl);

        if (!programFileId || typeof programFileId !== "string") {
          res
            .status(400)
            .send("Programa inválido: link de Google Drive inválido");
          return;
        }

        // Download program PDF from Drive
        const programPdfBuffer = await getDriveFileAsBuffer(programFileId);

        // 4. Combine: certificate with QR + program PDF
        const certificateWithQR = await fillPDFTemplate(templatePathToUse, {
          studentName,
          courseName,
          courseDate,
          qrImageBase64,
        });

        pdfBuffer = await combinePDFs([certificateWithQR, programPdfBuffer]);

        // 5. Re-upload combined PDF replacing "Certificado A"
        await uploadOrReplaceFile(
          certificateFileName,
          pdfBuffer,
          "application/pdf",
          config.drive.folderId,
        );
      }
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="certificado-${studentName || "sin-nombre"}.pdf"`,
    );

    if (!pdfBuffer) {
      res.status(500).send("No se pudo generar el certificado PDF");
      return;
    }

    res.send(pdfBuffer);
  } catch (error: any) {
    console.error(`Error al llenar el PDF: ${error.message}`, error);
    res
      .status(500)
      .send(
        error?.message
          ? `No se pudo generar el certificado: ${error.message}`
          : "Error al generar el certificado",
      );
  }
});
export default router;
