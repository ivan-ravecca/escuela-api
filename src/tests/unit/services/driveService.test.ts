import { Readable } from "stream";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getClient: vi.fn(),
  filesGet: vi.fn(),
  filesList: vi.fn(),
  filesUpdate: vi.fn(),
  filesCreate: vi.fn(),
  permissionsCreate: vi.fn(),
}));

vi.mock("googleapis", () => {
  class MockGoogleAuth {
    async getClient() {
      return mocks.getClient();
    }
  }

  return {
    google: {
      auth: {
        GoogleAuth: MockGoogleAuth,
      },
      drive: vi.fn(() => ({
        files: {
          get: mocks.filesGet,
          list: mocks.filesList,
          update: mocks.filesUpdate,
          create: mocks.filesCreate,
        },
        permissions: {
          create: mocks.permissionsCreate,
        },
      })),
    },
  };
});

import {
  extractFileIdFromUrl,
  getDriveFileAsBuffer,
  getDriveFileJWT,
  uploadOrReplaceFile,
} from "../../../services/driveService";

describe("driveService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getClient.mockResolvedValue({});
  });

  it("extracts file id from drive url", () => {
    const id = extractFileIdFromUrl("https://drive.google.com/file/d/abc123/view");
    expect(id).toBe("abc123");
  });

  it("returns null for invalid drive url", () => {
    const id = extractFileIdFromUrl("https://docs.google.com/nope");
    expect(id).toBeNull();
  });

  it("getDriveFileJWT returns stream and metadata for pdf", async () => {
    const stream = Readable.from(Buffer.from("pdf"));
    mocks.filesGet
      .mockResolvedValueOnce({ data: { name: "x.pdf", mimeType: "application/pdf" } })
      .mockResolvedValueOnce({ data: stream });

    const result = await getDriveFileJWT("id-1");

    expect(result.metadata.name).toBe("x.pdf");
    expect(result.stream).toBe(stream);
  });

  it("getDriveFileJWT throws if mime type is not pdf", async () => {
    mocks.filesGet.mockResolvedValueOnce({ data: { name: "x.txt", mimeType: "text/plain" } });

    await expect(getDriveFileJWT("id-2")).rejects.toThrow("El archivo no es un PDF");
  });

  it("getDriveFileAsBuffer returns file buffer", async () => {
    mocks.filesGet
      .mockResolvedValueOnce({ data: { name: "x.pdf", mimeType: "application/pdf" } })
      .mockResolvedValueOnce({ data: Uint8Array.from([1, 2, 3]).buffer });

    const result = await getDriveFileAsBuffer("id-3");

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.length).toBe(3);
  });

  it("uploadOrReplaceFile creates file when no existing one", async () => {
    mocks.filesList.mockResolvedValue({ data: { files: [] } });
    mocks.filesCreate.mockResolvedValue({ data: { id: "new-file-id" } });
    mocks.permissionsCreate.mockResolvedValue({});
    mocks.filesGet.mockResolvedValue({ data: { id: "new-file-id", name: "x.pdf", webViewLink: "https://drive/link" } });

    const result = await uploadOrReplaceFile("x.pdf", Buffer.from("data"));

    expect(mocks.filesCreate).toHaveBeenCalledTimes(1);
    expect(result.fileId).toBe("new-file-id");
  });

  it("uploadOrReplaceFile updates existing file", async () => {
    mocks.filesList.mockResolvedValue({ data: { files: [{ id: "existing-id" }] } });
    mocks.filesUpdate.mockResolvedValue({});
    mocks.permissionsCreate.mockResolvedValue({});
    mocks.filesGet.mockResolvedValue({ data: { id: "existing-id", name: "x.pdf", webViewLink: "https://drive/link" } });

    const result = await uploadOrReplaceFile("x.pdf", Buffer.from("data"));

    expect(mocks.filesUpdate).toHaveBeenCalledTimes(1);
    expect(result.fileId).toBe("existing-id");
  });
});
