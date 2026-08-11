import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as authService from "../../src/services/authService";
import { app } from "../../src/app";

vi.mock("../../src/services/authService", () => {
  return {
    verifyGoogleToken: vi.fn(),
    getUserInfoFromAccessToken: vi.fn(),
    generateToken: vi.fn(),
    verifyToken: vi.fn(),
  };
});

describe("Auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /auth/login returns token and user when google token is valid", async () => {
    vi.mocked(authService.verifyGoogleToken).mockResolvedValue({
      id: "u1",
      email: "dev@example.com",
      name: "Dev User",
      picture: "https://example.com/pic.png",
    });
    vi.mocked(authService.generateToken).mockReturnValue("jwt-test-token");

    const response = await request(app).post("/auth/login").send({
      googleToken: "valid-google-token",
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe("jwt-test-token");
    expect(response.body.user.email).toBe("dev@example.com");
  });

  it("POST /auth/login returns 401 when both token strategies fail", async () => {
    vi.mocked(authService.verifyGoogleToken).mockRejectedValue(
      new Error("invalid id token"),
    );
    vi.mocked(authService.getUserInfoFromAccessToken).mockRejectedValue(
      new Error("invalid access token"),
    );

    const response = await request(app).post("/auth/login").send({
      googleToken: "broken-token",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Token de Google inválido");
  });

  it("POST /auth/verify returns valid=true when jwt is valid", async () => {
    vi.mocked(authService.verifyToken).mockReturnValue({
      id: "u1",
      email: "dev@example.com",
      name: "Dev User",
      picture: "https://example.com/pic.png",
    });

    const response = await request(app).post("/auth/verify").send({
      token: "jwt-test-token",
    });

    expect(response.status).toBe(200);
    expect(response.body.valid).toBe(true);
    expect(response.body.user.email).toBe("dev@example.com");
  });

  it("GET /auth/me returns 401 when auth header is missing", async () => {
    const response = await request(app).get("/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("No se proporcionó token de autenticación");
  });
});
