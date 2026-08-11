import express from "express";
import request from "supertest";
import { Readable } from "stream";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDriveFileJWT: vi.fn(),
  extractFileIdFromUrl: vi.fn(),
  uploadOrReplaceFile: vi.fn(),
  getDriveFileAsBuffer: vi.fn(),
  createHash: vi.fn(),
  verifyHash: vi.fn(),
  generateQRCode: vi.fn(),
  fillPDFTemplate: vi.fn(),
  combinePDFs: vi.fn(),
}));

vi.mock("../../src/middleware/authMiddleware", () => ({
  authMiddleware: (req: any, res: any, next: any) => next(),
}));

vi.mock("../../src/services/driveService", () => {
  class AuthenticationRequiredError extends Error {
    constructor(message = "Authentication required") {
      super(message);
      this.name = "AuthenticationRequiredError";
    }
  }

  return {
    AuthenticationRequiredError,
    getDriveFileJWT: mocks.getDriveFileJWT,
    extractFileIdFromUrl: mocks.extractFileIdFromUrl,
    uploadOrReplaceFile: mocks.uploadOrReplaceFile,
    getDriveFileAsBuffer: mocks.getDriveFileAsBuffer,
  };
});

vi.mock("../../src/services/hashService", () => ({
  createHash: mocks.createHash,
  verifyHash: mocks.verifyHash,
}));

vi.mock("../../src/services/qrService", () => ({
  generateQRCode: mocks.generateQRCode,
}));

vi.mock("../../src/services/pdfTemplateService", () => ({
  fillPDFTemplate: mocks.fillPDFTemplate,
  combinePDFs: mocks.combinePDFs,
}));

import diplomaRouter from "../../src/routes/diploma";
import { AuthenticationRequiredError } from "../../src/services/driveService";

describe("Diploma routes with mocked externals", () => {
  const app = express();
  app.use(express.json());
  app.use("/diploma", diplomaRouter);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /diploma/generate should return 400 without link", async () => {
    const response = await request(app).get("/diploma/generate");
    expect(response.status).toBe(400);
    expect(response.text).toBe("Se requiere un link de Google Drive");
  });

  it("GET /diploma/generate should return 400 with invalid link", async () => {
    mocks.extractFileIdFromUrl.mockReturnValue(null);

    const response = await request(app)
      .get("/diploma/generate")
      .query({ link: "https://drive.google.com/file/d/abc/view" });

    expect(response.status).toBe(400);
    expect(response.text).toBe("Link de Google Drive inválido");
  });

  it("GET /diploma/generate should return image when link is valid", async () => {
    mocks.extractFileIdFromUrl.mockReturnValue("file-1");
    mocks.createHash.mockReturnValue("hash-1");
    mocks.generateQRCode.mockResolvedValue(Buffer.from("qr-image"));

    const response = await request(app)
      .get("/diploma/generate")
      .query({ link: "https://drive.google.com/file/d/file-1/view" });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("image/png");
  });

  it("GET /diploma/:id should redirect when auth is required", async () => {
    mocks.verifyHash.mockReturnValue("file-1");
    mocks.getDriveFileJWT.mockRejectedValue(new AuthenticationRequiredError());

    const response = await request(app).get("/diploma/hash-1");

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("/auth/google?returnUrl=");
  });

  it("GET /diploma/:id should return 404 when file not found", async () => {
    mocks.verifyHash.mockReturnValue("file-404");
    mocks.getDriveFileJWT.mockRejectedValue({ status: 404, message: "not found" });

    const response = await request(app).get("/diploma/hash-1");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Archivo no encontrado");
    expect(response.body.fileId).toBe("file-404");
  });

  it("GET /diploma/:id should stream pdf when file exists", async () => {
    mocks.verifyHash.mockReturnValue("file-ok");
    mocks.getDriveFileJWT.mockResolvedValue({
      stream: Readable.from([Buffer.from("pdf")]),
      metadata: { name: "certificado", mimeType: "application/pdf" },
    });

    const response = await request(app).get("/diploma/hash-1");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.headers["content-disposition"]).toContain(".pdf");
  });

  it("POST /diploma/certificate should return PDF for MEC flow", async () => {
    const pdf = Buffer.from("pdf-a");
    mocks.fillPDFTemplate.mockResolvedValue(pdf);
    mocks.uploadOrReplaceFile.mockResolvedValue({ webViewLink: "https://drive/file" });

    const response = await request(app).post("/diploma/certificate").send({
      studentName: "Ivan",
      courseName: "Auxiliar",
      courseDate: "2026-08-11",
      certMec: true,
    });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(mocks.fillPDFTemplate).toHaveBeenCalled();
    expect(mocks.uploadOrReplaceFile).toHaveBeenCalled();
  });

  it("POST /diploma/certificate should return 500 when webViewLink is missing", async () => {
    mocks.fillPDFTemplate.mockResolvedValue(Buffer.from("pdf-a"));
    mocks.uploadOrReplaceFile.mockResolvedValue({ webViewLink: "" });

    const response = await request(app).post("/diploma/certificate").send({
      studentName: "Ivan",
      courseName: "Auxiliar",
      courseDate: "2026-08-11",
      certMec: false,
    });

    expect(response.status).toBe(500);
    expect(response.text).toContain("No se pudo obtener el enlace compartido");
  });

  it("POST /diploma/certificate should return 400 for unconfigured program option", async () => {
    mocks.fillPDFTemplate.mockResolvedValue(Buffer.from("pdf-a"));
    mocks.uploadOrReplaceFile.mockResolvedValue({ webViewLink: "https://drive/file" });
    mocks.extractFileIdFromUrl.mockImplementation((url: string) => {
      if (url.includes("https://drive/file")) return "cert-file-id";
      const match = url.match(/\/file\/d\/([^/]+)/);
      return match ? match[1] : null;
    });
    mocks.createHash.mockReturnValue("hash-1");
    mocks.generateQRCode.mockResolvedValue(Buffer.from("qr"));

    const response = await request(app).post("/diploma/certificate").send({
      studentName: "Ivan",
      courseName: "Auxiliar",
      courseDate: "2026-08-11",
      certMec: false,
      programOption: "programa-inexistente",
    });

    expect(response.status).toBe(400);
    expect(response.text).toContain("Programa inválido");
  });

  it("POST /diploma/certificate should return combined PDF for program flow", async () => {
    const initialPdf = Buffer.from("initial");
    const qrPdf = Buffer.from("qr-pdf");
    const programPdf = Buffer.from("program");
    const combined = Buffer.from("combined");

    mocks.fillPDFTemplate
      .mockResolvedValueOnce(initialPdf)
      .mockResolvedValueOnce(qrPdf);
    mocks.uploadOrReplaceFile.mockResolvedValue({
      webViewLink: "https://drive.google.com/file/d/cert-file-id/view",
    });
    mocks.extractFileIdFromUrl.mockImplementation((url: string) => {
      const match = url.match(/\/file\/d\/([^/]+)/);
      return match ? match[1] : null;
    });
    mocks.createHash.mockReturnValue("hash-1");
    mocks.generateQRCode.mockResolvedValue(Buffer.from("qr"));
    mocks.getDriveFileAsBuffer.mockResolvedValue(programPdf);
    mocks.combinePDFs.mockResolvedValue(combined);

    const response = await request(app).post("/diploma/certificate").send({
      studentName: "Ivan",
      courseName: "Auxiliar",
      courseDate: "2026-08-11",
      certMec: false,
      programOption: "prog-mc-ostomias",
    });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(mocks.combinePDFs).toHaveBeenCalledOnce();
    expect(mocks.getDriveFileAsBuffer).toHaveBeenCalledOnce();
  });
});
