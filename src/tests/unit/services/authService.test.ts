import { beforeEach, describe, expect, it, vi } from "vitest";
import { OAuth2Client } from "google-auth-library";
import {
  generateToken,
  getUserInfoFromAccessToken,
  verifyGoogleToken,
  verifyToken,
} from "../../../services/authService";

describe("authService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("generates and verifies jwt token", () => {
    const user = {
      id: "user-1",
      email: "user@escuelaenfermeria.com.uy",
      name: "User Test",
      picture: "pic",
    };

    const token = generateToken(user);
    const decoded = verifyToken(token);

    expect(token).toBeTypeOf("string");
    expect(decoded).toEqual(user);
  });

  it("throws when verifying malformed token", () => {
    expect(() => verifyToken("invalid.token")).toThrow("Token inválido o expirado");
  });

  it("verifyGoogleToken returns user info for valid payload", async () => {
    vi.spyOn(OAuth2Client.prototype, "verifyIdToken").mockResolvedValue({
      getPayload: () => ({
        sub: "google-user-1",
        email: "user@escuelaenfermeria.com.uy",
        name: "Google User",
        picture: "pic",
      }),
    } as any);

    const result = await verifyGoogleToken("id-token");

    expect(result).toEqual({
      id: "google-user-1",
      email: "user@escuelaenfermeria.com.uy",
      name: "Google User",
      picture: "pic",
    });
  });

  it("verifyGoogleToken throws for invalid domain", async () => {
    vi.spyOn(OAuth2Client.prototype, "verifyIdToken").mockResolvedValue({
      getPayload: () => ({
        sub: "google-user-1",
        email: "user@other.com",
        name: "Google User",
      }),
    } as any);

    await expect(verifyGoogleToken("id-token")).rejects.toThrow(
      "Token de Google inválido o expirado",
    );
  });

  it("getUserInfoFromAccessToken returns mapped user", async () => {
    vi.spyOn(globalThis, "fetch" as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        sub: "u-22",
        email: "user@escuelaenfermeria.com.uy",
        name: "Access User",
        picture: "pic-url",
      }),
    } as any);

    const result = await getUserInfoFromAccessToken("access-token");

    expect(result).toEqual({
      id: "u-22",
      email: "user@escuelaenfermeria.com.uy",
      name: "Access User",
      picture: "pic-url",
    });
  });

  it("getUserInfoFromAccessToken throws when response is not ok", async () => {
    vi.spyOn(globalThis, "fetch" as any).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as any);

    await expect(getUserInfoFromAccessToken("access-token")).rejects.toThrow(
      "Error al obtener información del usuario",
    );
  });
});
