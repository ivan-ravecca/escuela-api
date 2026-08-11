import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mockReadFileSync: vi.fn(),
  mockLoad: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock("fs", () => ({
  default: {
    readFileSync: mocks.mockReadFileSync,
  },
}));

vi.mock("pdf-lib", () => {
  return {
    TextAlignment: {
      Center: "Center",
    },
    PDFDocument: {
      load: mocks.mockLoad,
      create: mocks.mockCreate,
    },
  };
});

import { combinePDFs, fillPDFTemplate } from "../../../src/services/pdfTemplateService";

describe("pdfTemplateService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fillPDFTemplate should set fields, embed QR and return buffer", async () => {
    const textField = () => ({
      setText: vi.fn(),
      setAlignment: vi.fn(),
      enableReadOnly: vi.fn(),
    });

    const studentField = textField();
    const courseField = textField();
    const dateField = textField();
    const typeField = textField();

    const form = {
      getFields: vi.fn().mockReturnValue([]),
      getTextField: vi.fn((name: string) => {
        if (name === "studentName") return studentField;
        if (name === "courseName") return courseField;
        if (name === "courseDate") return dateField;
        if (name === "courseType") return typeField;
        return textField();
      }),
      flatten: vi.fn(),
    };

    const firstPage = {
      getSize: vi.fn().mockReturnValue({ width: 800, height: 600 }),
      drawImage: vi.fn(),
    };

    const mockPdfDoc = {
      getForm: vi.fn().mockReturnValue(form),
      embedPng: vi.fn().mockResolvedValue({ width: 200, height: 200 }),
      getPages: vi.fn().mockReturnValue([firstPage]),
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

    mocks.mockReadFileSync.mockReturnValue(Buffer.from("template"));
    mocks.mockLoad.mockResolvedValue(mockPdfDoc);

    const result = await fillPDFTemplate("template.pdf", {
      studentName: "Ivan",
      courseName: "Auxiliar",
      courseDate: "2026-08-11",
      courseType: "Aprobó el curso de",
      qrImageBase64: "data:image/png;base64,ZmFrZS1pbWFnZQ==",
    });

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(studentField.setText).toHaveBeenCalledWith("Ivan");
    expect(courseField.setText).toHaveBeenCalledWith("Auxiliar");
    expect(dateField.setText).toHaveBeenCalledWith("2026-08-11");
    expect(typeField.setText).toHaveBeenCalledWith("Aprobó el curso de");
    expect(form.flatten).toHaveBeenCalledOnce();
    expect(firstPage.drawImage).toHaveBeenCalledOnce();
  });

  it("fillPDFTemplate should tolerate missing courseType field", async () => {
    const textField = () => ({
      setText: vi.fn(),
      setAlignment: vi.fn(),
      enableReadOnly: vi.fn(),
    });

    const form = {
      getFields: vi.fn().mockReturnValue([]),
      getTextField: vi.fn((name: string) => {
        if (name === "courseType") {
          throw new Error("missing field");
        }
        return textField();
      }),
      flatten: vi.fn(),
    };

    const mockPdfDoc = {
      getForm: vi.fn().mockReturnValue(form),
      embedPng: vi.fn(),
      getPages: vi.fn().mockReturnValue([]),
      setAuthor: vi.fn(),
      setTitle: vi.fn(),
      setSubject: vi.fn(),
      setKeywords: vi.fn(),
      setProducer: vi.fn(),
      setCreator: vi.fn(),
      setCreationDate: vi.fn(),
      setModificationDate: vi.fn(),
      setLanguage: vi.fn(),
      save: vi.fn().mockResolvedValue(Uint8Array.from([9, 9, 9])),
    };

    mocks.mockReadFileSync.mockReturnValue(Buffer.from("template"));
    mocks.mockLoad.mockResolvedValue(mockPdfDoc);

    const result = await fillPDFTemplate("template.pdf", {
      studentName: "Ivan",
      courseName: "Auxiliar",
      courseDate: "2026-08-11",
      courseType: "Aprobó el curso de",
    });

    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it("combinePDFs should merge pages and return combined buffer", async () => {
    const combinedPdf = {
      copyPages: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
      addPage: vi.fn(),
      save: vi.fn().mockResolvedValue(Uint8Array.from([7, 8, 9])),
    };

    const sourcePdf = {
      getPageIndices: vi.fn().mockReturnValue([0, 1]),
    };

    mocks.mockCreate.mockResolvedValue(combinedPdf);
    mocks.mockLoad.mockResolvedValue(sourcePdf);

    const result = await combinePDFs([Buffer.from("a"), Buffer.from("b")]);

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(mocks.mockLoad).toHaveBeenCalledTimes(2);
    expect(combinedPdf.copyPages).toHaveBeenCalledTimes(2);
    expect(combinedPdf.addPage).toHaveBeenCalledTimes(4);
  });
});
