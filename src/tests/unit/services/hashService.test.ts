import { describe, expect, it } from "vitest";
import { createHash, verifyHash } from "../../../services/hashService";

describe("hashService", () => {
  it("creates URL-safe hash and verifies roundtrip", () => {
    const fileId = "1A2B3C4D5E";
    const hash = createHash(fileId);

    expect(hash).toBeTruthy();
    expect(hash).not.toContain("+");
    expect(hash).not.toContain("/");
    expect(hash).not.toContain("=");

    const decoded = verifyHash(hash as string);
    expect(decoded).toBe(fileId);
  });

  it("returns null for tampered hash", () => {
    const hash = createHash("abcd-1234") as string;
    const tampered = `${hash.slice(0, -1)}x`;

    expect(verifyHash(tampered)).toBeNull();
  });
});
