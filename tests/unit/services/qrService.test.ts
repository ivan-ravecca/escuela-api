import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("qrcode", () => {
  return {
    default: {
      toBuffer: vi.fn(),
    },
  };
});

import QRCode from "qrcode";
import { generateQRCode } from "../../../src/services/qrService";

describe("qrService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate QR buffer", async () => {
    const expected = Buffer.from("fake-qr");
    vi.mocked(QRCode.toBuffer).mockResolvedValue(expected);

    const result = await generateQRCode("https://example.com");

    expect(result).toEqual(expected);
    expect(QRCode.toBuffer).toHaveBeenCalledOnce();
  });

  it("should throw when QR generation fails", async () => {
    vi.mocked(QRCode.toBuffer).mockRejectedValue(new Error("qr failure"));

    await expect(generateQRCode("https://example.com")).rejects.toThrow("qr failure");
  });
});
