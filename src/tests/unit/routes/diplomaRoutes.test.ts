import express from "express";
import request from "supertest";
import { Readable } from "stream";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyHash: vi.fn(),
  extractFileIdFromUrl: vi.fn(),
  createHash: vi.fn<() => string | null>(() => "hashed"),
  generateQRCode: vi.fn(),
  getDriveFileJWT: vi.fn(),
  fillPDFTemplate: vi.fn(),
  combinePDFs: vi.fn(),
  uploadOrReplaceFile: vi.fn(),
  getDriveFileAsBuffer: vi.fn(),
}));

vi.mock("../../../middleware/authMiddleware", () => ({
  authMiddleware: (req: any, res: any, next: any) => next(),
}));

vi.mock("../../../services/hashService", () => ({
  createHash: mocks.createHash,
  verifyHash: mocks.verifyHash,
}));

vi.mock("../../../services/qrService", () => ({
  generateQRCode: mocks.generateQRCode,
}));

vi.mock("../../../services/pdfTemplateService", () => ({
  fillPDFTemplate: mocks.fillPDFTemplate,
  combinePDFs: mocks.combinePDFs,
}));

vi.mock("../../../services/driveService", () => ({
  AuthenticationRequiredError: class AuthenticationRequiredError extends Error {},
  getDriveFileJWT: mocks.getDriveFileJWT,
  extractFileIdFromUrl: mocks.extractFileIdFromUrl,
  uploadOrReplaceFile: mocks.uploadOrReplaceFile,
  getDriveFileAsBuffer: mocks.getDriveFileAsBuffer,
}));

import diplomaRoutes from "../../../routes/diploma";
import { AuthenticationRequiredError } from "../../../services/driveService";

describe("diplomaRoutes", () => {
  const app = express();
  app.use(express.json());
  app.use("/diploma", diplomaRoutes);

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.generateQRCode.mockResolvedValue(Buffer.from("qr"));
    mocks.fillPDFTemplate.mockResolvedValue(Buffer.from("pdf"));
    mocks.uploadOrReplaceFile.mockResolvedValue({
      fileId: "file-1",
      name: "cert.pdf",
      webViewLink: "https://drive.google.com/file/d/file-1/view",
    });
    mocks.extractFileIdFromUrl.mockReturnValue("file-1");
  });

  it("GET /diploma responds with base message", async () => {
    const response = await request(app).get("/diploma");

    expect(response.status).toBe(200);
    expect(response.text).toContain("You cannot GET diploma");
  });

  it("GET /diploma/:id returns 400 when hash is invalid", async () => {
    mocks.verifyHash.mockReturnValue(null);

    const response = await request(app).get("/diploma/invalid-hash");

    expect(response.status).toBe(400);
    expect(response.text).toContain("ID de diploma inválido");
  });

  it("GET /diploma/generate returns 400 when link is missing", async () => {
    const response = await request(app).get("/diploma/generate");

    expect(response.status).toBe(400);
    expect(response.text).toContain("Se requiere un link de Google Drive");
  });

  it("GET /diploma/generate returns 400 when link is invalid", async () => {
    mocks.extractFileIdFromUrl.mockReturnValue(null);

    const response = await request(app)
      .get("/diploma/generate")
      .query({ link: "https://drive.google.com/nope" });

    expect(response.status).toBe(400);
    expect(response.text).toContain("Link de Google Drive inválido");
  });

  it("GET /diploma/generate returns png when link is valid", async () => {
    mocks.extractFileIdFromUrl.mockReturnValue("file-ok");
    mocks.createHash.mockReturnValue("hash-ok");
    mocks.generateQRCode.mockResolvedValue(Buffer.from("png"));

    const response = await request(app)
      .get("/diploma/generate")
      .query({ link: "https://drive.google.com/file/d/file-ok/view" });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("image/png");
  });

  it("GET /diploma/:id returns 404 when Drive file is missing", async () => {
    mocks.verifyHash.mockReturnValue("file-404");
    mocks.getDriveFileJWT.mockRejectedValue({ status: 404, message: "not found" });

    const response = await request(app).get("/diploma/hash-404");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Archivo no encontrado");
  });

  it("GET /diploma/:id streams pdf when hash and file are valid", async () => {
    mocks.verifyHash.mockReturnValue("file-ok");
    mocks.getDriveFileJWT.mockResolvedValue({
      metadata: { name: "cert.pdf", mimeType: "application/pdf" },
      stream: Readable.from(Buffer.from("pdf-data")),
    });

    const response = await request(app).get("/diploma/hash-ok");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
  });

  it("GET /diploma/:id appends .pdf when filename has no extension", async () => {
    mocks.verifyHash.mockReturnValue("file-noext");
    mocks.getDriveFileJWT.mockResolvedValue({
      metadata: { name: "Mi Certificado", mimeType: "application/pdf" },
      stream: Readable.from(Buffer.from("pdf-data")),
    });

    const response = await request(app).get("/diploma/hash-noext");

    expect(response.status).toBe(200);
    expect(response.headers["content-disposition"]).toContain(".pdf");
  });

  it("GET /diploma/:id redirects to auth when authentication is required", async () => {
    mocks.verifyHash.mockReturnValue("file-auth");
    mocks.getDriveFileJWT.mockRejectedValue(new AuthenticationRequiredError());

    const response = await request(app).get("/diploma/hash-auth");

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("/auth/google?returnUrl=");
  });

  it("GET /diploma/:id returns 500 for unknown errors", async () => {
    mocks.verifyHash.mockReturnValue("file-err");
    mocks.getDriveFileJWT.mockRejectedValue(new Error("unexpected drive error"));

    const response = await request(app).get("/diploma/hash-err");

    expect(response.status).toBe(500);
    expect(response.text).toContain("Error al procesar la solicitud");
  });

  it("POST /diploma/certificate returns generated PDF for mec flow", async () => {
    const response = await request(app).post("/diploma/certificate").send({
      studentName: "Juan",
      courseName: "Curso",
      courseDate: "2026-01-01",
      certMec: true,
    });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(mocks.fillPDFTemplate).toHaveBeenCalledTimes(1);
    expect(mocks.uploadOrReplaceFile).toHaveBeenCalledTimes(1);
  });

  it("POST /diploma/certificate supports mec flow with program option", async () => {
    const response = await request(app).post("/diploma/certificate").send({
      studentName: "Ana",
      courseName: "Curso",
      courseDate: "2026-01-01",
      certMec: true,
      programOption: "prog-ac-iaas",
    });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
  });

  it("POST /diploma/certificate returns 500 when hash cannot be created", async () => {
    mocks.createHash.mockReturnValueOnce(null);

    const response = await request(app).post("/diploma/certificate").send({
      studentName: "Juan",
      courseName: "Curso",
      courseDate: "2026-01-01",
      certMec: false,
    });

    expect(response.status).toBe(500);
    expect(response.text).toContain("No se pudo generar el certificado");
  });

  it("POST /diploma/certificate returns 500 when upload has no webViewLink", async () => {
    mocks.uploadOrReplaceFile.mockResolvedValue({
      fileId: "file-1",
      name: "cert.pdf",
      webViewLink: "",
    });

    const response = await request(app).post("/diploma/certificate").send({
      studentName: "Juan",
      courseName: "Curso",
      courseDate: "2026-01-01",
      certMec: false,
    });

    expect(response.status).toBe(500);
    expect(response.text).toContain("No se pudo obtener el enlace compartido");
  });

  it("POST /diploma/certificate returns 400 for invalid program option", async () => {
    const response = await request(app).post("/diploma/certificate").send({
      studentName: "Juan",
      courseName: "Curso",
      courseDate: "2026-01-01",
      certMec: false,
      programOption: "unknown-program",
    });

    expect(response.status).toBe(400);
    expect(response.text).toContain("Programa inválido");
  });

  it("POST /diploma/certificate returns 400 when program drive link cannot be parsed", async () => {
    mocks.extractFileIdFromUrl
      .mockReturnValueOnce("uploaded-id")
      .mockReturnValueOnce(null);

    const response = await request(app).post("/diploma/certificate").send({
      studentName: "Juan",
      courseName: "Curso",
      courseDate: "2026-01-01",
      certMec: false,
      programOption: "prog-ac-iaas",
    });

    expect(response.status).toBe(400);
    expect(response.text).toContain("link de Google Drive inválido");
  });

  it("POST /diploma/certificate combines program PDF and returns file", async () => {
    mocks.extractFileIdFromUrl
      .mockReturnValueOnce("uploaded-id")
      .mockReturnValueOnce("program-file-id");
    mocks.getDriveFileAsBuffer.mockResolvedValue(Buffer.from("program-pdf"));
    mocks.combinePDFs.mockResolvedValue(Buffer.from("combined-pdf"));

    const response = await request(app).post("/diploma/certificate").send({
      studentName: "Juan",
      courseName: "Curso",
      courseDate: "2026-01-01",
      certMec: false,
      programOption: "prog-ac-iaas",
    });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(mocks.combinePDFs).toHaveBeenCalledTimes(1);
  });
});
