import { Readable } from "stream";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mockGetClient: vi.fn(),
  mockGoogleDrive: vi.fn(),
  mockFilesGet: vi.fn(),
  mockFilesList: vi.fn(),
  mockFilesUpdate: vi.fn(),
  mockFilesCreate: vi.fn(),
  mockPermissionsCreate: vi.fn(),
}));

vi.mock("googleapis", () => {
  return {
    google: {
      auth: {
        GoogleAuth: vi.fn().mockImplementation(() => ({
          getClient: mocks.mockGetClient,
        })),
      },
      drive: mocks.mockGoogleDrive,
    },
  };
});

import {
  extractFileIdFromUrl,
  getDriveFileAsBuffer,
  getDriveFileJWT,
  uploadOrReplaceFile,
} from "../../../src/services/driveService";

describe("driveService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.mockGetClient.mockResolvedValue({});
    mocks.mockGoogleDrive.mockReturnValue({
      files: {
        get: mocks.mockFilesGet,
        list: mocks.mockFilesList,
        update: mocks.mockFilesUpdate,
        create: mocks.mockFilesCreate,
      },
      permissions: {
        create: mocks.mockPermissionsCreate,
      },
    });
  });

  it("extractFileIdFromUrl should return id from drive url", () => {
    const result = extractFileIdFromUrl("https://drive.google.com/file/d/abc123/view");
    expect(result).toBe("abc123");
  });

  it("extractFileIdFromUrl should return null for invalid url", () => {
    const result = extractFileIdFromUrl("https://example.com/no-drive");
    expect(result).toBeNull();
  });

  it("getDriveFileJWT should return stream and metadata for PDF", async () => {
    const stream = Readable.from(["pdf-content"]);
    mocks.mockFilesGet
      .mockResolvedValueOnce({ data: { name: "cert.pdf", mimeType: "application/pdf" } })
      .mockResolvedValueOnce({ data: stream });

    const result = await getDriveFileJWT("file-1");

    expect(result.metadata.name).toBe("cert.pdf");
    expect(result.metadata.mimeType).toBe("application/pdf");
    expect(result.stream).toBe(stream);
  });

  it("getDriveFileJWT should throw when file is not PDF", async () => {
    mocks.mockFilesGet.mockResolvedValueOnce({
      data: { name: "cert.txt", mimeType: "text/plain" },
    });

    await expect(getDriveFileJWT("file-1")).rejects.toThrow("El archivo no es un PDF");
  });

  it("getDriveFileAsBuffer should return buffer for PDF", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]).buffer;
    mocks.mockFilesGet
      .mockResolvedValueOnce({ data: { name: "cert.pdf", mimeType: "application/pdf" } })
      .mockResolvedValueOnce({ data: bytes });

    const result = await getDriveFileAsBuffer("file-1");

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(Array.from(result)).toEqual([1, 2, 3, 4]);
  });

  it("getDriveFileAsBuffer should throw when file is not PDF", async () => {
    mocks.mockFilesGet.mockResolvedValueOnce({
      data: { name: "cert.txt", mimeType: "text/plain" },
    });

    await expect(getDriveFileAsBuffer("file-1")).rejects.toThrow("El archivo no es un PDF");
  });

  it("uploadOrReplaceFile should update existing file", async () => {
    mocks.mockFilesList.mockResolvedValue({
      data: { files: [{ id: "existing-id", name: "cert.pdf", webViewLink: "https://drive/link" }] },
    });
    mocks.mockFilesUpdate.mockResolvedValue({ data: { id: "existing-id" } });
    mocks.mockPermissionsCreate.mockResolvedValue({ data: { id: "perm-1" } });
    mocks.mockFilesGet.mockResolvedValue({
      data: { id: "existing-id", name: "cert.pdf", webViewLink: "https://drive/link" },
    });

    const result = await uploadOrReplaceFile("cert.pdf", Buffer.from("pdf"), "application/pdf");

    expect(mocks.mockFilesUpdate).toHaveBeenCalledOnce();
    expect(mocks.mockFilesCreate).not.toHaveBeenCalled();
    expect(result.fileId).toBe("existing-id");
    expect(result.webViewLink).toBe("https://drive/link");
  });

  it("uploadOrReplaceFile should create file when no existing match", async () => {
    mocks.mockFilesList.mockResolvedValue({ data: { files: [] } });
    mocks.mockFilesCreate.mockResolvedValue({ data: { id: "created-id" } });
    mocks.mockPermissionsCreate.mockResolvedValue({ data: { id: "perm-1" } });
    mocks.mockFilesGet.mockResolvedValue({
      data: { id: "created-id", name: "cert.pdf", webViewLink: "https://drive/new-link" },
    });

    const result = await uploadOrReplaceFile("cert.pdf", Buffer.from("pdf"), "application/pdf", "folder-1");

    expect(mocks.mockFilesCreate).toHaveBeenCalledOnce();
    expect(result.fileId).toBe("created-id");
    expect(result.webViewLink).toBe("https://drive/new-link");
  });
});
