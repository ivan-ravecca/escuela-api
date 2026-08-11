import { describe, expect, it } from "vitest";
import { createHash, verifyHash } from "../../../src/services/hashService";

describe("hashService", () => {
  it("should create and verify reversible hash", () => {
    const fileId = "google-drive-file-123";
    const hash = createHash(fileId);

    expect(hash).toBeTruthy();

    const decoded = verifyHash(hash as string);
    expect(decoded).toBe(fileId);
  });

  it("should return null when hash is invalid", () => {
    const decoded = verifyHash("not-a-valid-hash");
    expect(decoded).toBeNull();
  });
});
