import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("qrcode", () => ({
  default: {
    toBuffer: vi.fn(),
  },
}));

import QRCode from "qrcode";
import { generateQRCode } from "../../../services/qrService";

const mockedToBuffer = (QRCode as any).toBuffer as ReturnType<typeof vi.fn>;

describe("qrService", () => {
  beforeEach(() => {
    mockedToBuffer.mockReset();
  });

  it("generates qr buffer with expected options", async () => {
    const buffer = Buffer.from("qr");
    mockedToBuffer.mockResolvedValue(buffer);

    const result = await generateQRCode("https://example.com");

    expect(result).toBe(buffer);
    expect(mockedToBuffer).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({
        errorCorrectionLevel: "H",
        type: "png",
      }),
    );
  });

  it("throws when qrcode provider fails", async () => {
    mockedToBuffer.mockRejectedValue(new Error("qrcode-fail"));

    await expect(generateQRCode("https://example.com")).rejects.toThrow("qrcode-fail");
  });
});
