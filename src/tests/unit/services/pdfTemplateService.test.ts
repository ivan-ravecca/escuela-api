import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readFileSync: vi.fn(),
  PDFDocumentLoad: vi.fn(),
  PDFDocumentCreate: vi.fn(),
  loadedDoc: null as any,
  combinedDoc: null as any,
  form: null as any,
}));

vi.mock("fs", () => ({
  default: {
    readFileSync: mocks.readFileSync,
  },
}));

vi.mock("pdf-lib", () => ({
  TextAlignment: {
    Center: "center",
  },
  PDFDocument: {
    load: mocks.PDFDocumentLoad,
    create: mocks.PDFDocumentCreate,
  },
}));

import { combinePDFs, fillPDFTemplate } from "../../../services/pdfTemplateService";

describe("pdfTemplateService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const studentField = {
      setText: vi.fn(),
      setAlignment: vi.fn(),
      enableReadOnly: vi.fn(),
    };
    const courseField = {
      setText: vi.fn(),
      setAlignment: vi.fn(),
      enableReadOnly: vi.fn(),
    };
    const dateField = {
      setText: vi.fn(),
      setAlignment: vi.fn(),
      enableReadOnly: vi.fn(),
    };

    const firstPage = {
      getSize: vi.fn(() => ({ width: 800, height: 600 })),
      drawImage: vi.fn(),
    };

    mocks.form = {
      getFields: vi.fn(() => []),
      getTextField: vi.fn((name: string) => {
        if (name === "studentName") return studentField;
        if (name === "courseName") return courseField;
        if (name === "courseDate") return dateField;
        throw new Error(`unknown field ${name}`);
      }),
      flatten: vi.fn(),
    };

    mocks.loadedDoc = {
      getForm: vi.fn(() => mocks.form),
      embedPng: vi.fn().mockResolvedValue({ width: 200, height: 200 }),
      getPages: vi.fn(() => [firstPage]),
      setAuthor: vi.fn(),
      setTitle: vi.fn(),
      setSubject: vi.fn(),
      setKeywords: vi.fn(),
      setProducer: vi.fn(),
      setCreator: vi.fn(),
      setCreationDate: vi.fn(),
      setModificationDate: vi.fn(),
      setLanguage: vi.fn(),
      save: vi.fn().mockResolvedValue(Uint8Array.from([1, 2, 3])),
    };

    mocks.combinedDoc = {
      copyPages: vi.fn().mockResolvedValue(["page-a", "page-b"]),
      addPage: vi.fn(),
      save: vi.fn().mockResolvedValue(Uint8Array.from([9, 8, 7])),
    };

    mocks.readFileSync.mockImplementation(() => Buffer.from("template"));
    mocks.PDFDocumentLoad.mockResolvedValue(mocks.loadedDoc);
    mocks.PDFDocumentCreate.mockResolvedValue(mocks.combinedDoc);
  });

  it("fills PDF template and returns buffer", async () => {
    const result = await fillPDFTemplate("template.pdf", {
      studentName: "Juan Perez",
      courseName: "Curso X",
      courseDate: "2026-01-01",
      qrImageBase64: `data:image/png;base64,${Buffer.from("qr").toString("base64")}`,
    });

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(mocks.readFileSync).toHaveBeenCalledWith("template.pdf");
    expect(mocks.loadedDoc.embedPng).toHaveBeenCalledTimes(1);
    expect(mocks.form.flatten).toHaveBeenCalledTimes(1);
  });

  it("combines multiple pdf buffers", async () => {
    const fakeLoaded = {
      getPageIndices: vi.fn(() => [0, 1]),
    };
    mocks.PDFDocumentLoad.mockResolvedValue(fakeLoaded as any);

    const result = await combinePDFs([Buffer.from("a"), Buffer.from("b")]);

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(mocks.combinedDoc.copyPages).toHaveBeenCalledTimes(2);
    expect(mocks.combinedDoc.addPage).toHaveBeenCalledTimes(4);
  });
});
