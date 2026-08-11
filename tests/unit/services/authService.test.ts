import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("jsonwebtoken", () => {
  return {
    default: {
      sign: vi.fn(),
      verify: vi.fn(),
    },
  };
});

import {
  generateToken,
  getUserInfoFromAccessToken,
  verifyGoogleToken,
  verifyToken,
} from "../../../src/services/authService";

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verifyGoogleToken should return mapped user info", async () => {
    const user = await verifyGoogleToken("valid-google-token");

    expect(user.id).toBe("user-1");
    expect(user.email).toBe("test@example.com");
    expect(user.name).toBe("Test User");
  });

  it("getUserInfoFromAccessToken should return mapped user info", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          sub: "user-2",
          email: "test@example.com",
          name: "Fetched User",
          picture: "https://example.com/pic.png",
        }),
      }),
    );

    const user = await getUserInfoFromAccessToken("access-token");

    expect(user.id).toBe("user-2");
    expect(user.email).toBe("test@example.com");
    expect(user.name).toBe("Fetched User");
  });

  it("getUserInfoFromAccessToken should throw when response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      }),
    );

    await expect(getUserInfoFromAccessToken("invalid")).rejects.toThrow(
      "Error al obtener información del usuario",
    );
  });

  it("generateToken should call jwt.sign", () => {
    vi.mocked(jwt.sign).mockReturnValue("jwt-token" as any);

    const token = generateToken({
      id: "u1",
      email: "test@example.com",
      name: "Test",
      picture: "https://example.com/pic.png",
    });

    expect(token).toBe("jwt-token");
    expect(jwt.sign).toHaveBeenCalledOnce();
  });

  it("verifyToken should decode token with jwt.verify", () => {
    vi.mocked(jwt.verify).mockReturnValue({
      sub: "u1",
      email: "test@example.com",
      name: "Decoded User",
      picture: "https://example.com/pic.png",
    } as any);

    const user = verifyToken("jwt-token");

    expect(user.id).toBe("u1");
    expect(user.email).toBe("test@example.com");
    expect(user.name).toBe("Decoded User");
  });

  it("verifyToken should throw normalized error when jwt fails", () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error("broken token");
    });

    expect(() => verifyToken("bad-token")).toThrow("Token inválido o expirado");
  });
});
