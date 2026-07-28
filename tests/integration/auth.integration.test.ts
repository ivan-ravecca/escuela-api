import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app";
import config from "../../src/config";

const { verifyGoogleTokenMock, getUserInfoFromAccessTokenMock, generateTokenMock, verifyTokenMock } = vi.hoisted(() => ({
  verifyGoogleTokenMock: vi.fn(),
  getUserInfoFromAccessTokenMock: vi.fn(),
  generateTokenMock: vi.fn(),
  verifyTokenMock: vi.fn(),
}));

vi.mock("../../src/services/authService", () => ({
  verifyGoogleToken: verifyGoogleTokenMock,
  getUserInfoFromAccessToken: getUserInfoFromAccessTokenMock,
  generateToken: generateTokenMock,
  verifyToken: verifyTokenMock,
}));

describe("Auth integration routes", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /auth/login returns a token for a valid Google ID token", async () => {
    verifyGoogleTokenMock.mockResolvedValue({
      id: "user-1",
      email: "user@escuelaenfermeria.com.uy",
      name: "Test User",
      picture: "https://example.com/avatar.png",
    });
    generateTokenMock.mockReturnValue("jwt-token");

    const response = await request(app)
      .post("/auth/login")
      .send({ googleToken: "good-id-token" });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe("jwt-token");
    expect(response.body.user.email).toBe("user@escuelaenfermeria.com.uy");
    expect(verifyGoogleTokenMock).toHaveBeenCalledWith("good-id-token");
  });

  it("POST /auth/login falls back to access token when ID token fails", async () => {
    verifyGoogleTokenMock.mockRejectedValue(new Error("bad id token"));
    getUserInfoFromAccessTokenMock.mockResolvedValue({
      id: "user-2",
      email: "user2@escuelaenfermeria.com.uy",
      name: "Fallback User",
    });
    generateTokenMock.mockReturnValue("fallback-token");

    const response = await request(app)
      .post("/auth/login")
      .send({ googleToken: "access-token" });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe("fallback-token");
    expect(getUserInfoFromAccessTokenMock).toHaveBeenCalledWith("access-token");
  });

  it("POST /auth/login returns 401 when both token methods fail", async () => {
    verifyGoogleTokenMock.mockRejectedValue(new Error("bad id token"));
    getUserInfoFromAccessTokenMock.mockRejectedValue(new Error("bad access token"));

    const response = await request(app)
      .post("/auth/login")
      .send({ googleToken: "bad-token" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Token de Google inválido");
  });

  it("POST /auth/verify returns valid=true for a valid token", async () => {
    verifyTokenMock.mockReturnValue({
      id: "user-3",
      email: "user3@escuelaenfermeria.com.uy",
      name: "Verified User",
      picture: "https://example.com/avatar-3.png",
    });

    const response = await request(app)
      .post("/auth/verify")
      .send({ token: "valid-jwt-token" });

    expect(response.status).toBe(200);
    expect(response.body.valid).toBe(true);
    expect(response.body.user.email).toBe("user3@escuelaenfermeria.com.uy");
    expect(verifyTokenMock).toHaveBeenCalledWith("valid-jwt-token");
  });

  it("POST /auth/verify returns 403 for unauthorized email domain", async () => {
    verifyTokenMock.mockReturnValue({
      id: "user-4",
      email: "user@gmail.com",
      name: "Unauthorized User",
    });

    const response = await request(app)
      .post("/auth/verify")
      .send({ token: "valid-but-forbidden-domain" });

    expect(response.status).toBe(403);
    expect(response.body.valid).toBe(false);
    expect(response.body.message).toBe("Dominio de correo no autorizado");
  });

  it("POST /auth/verify returns 401 for invalid token", async () => {
    verifyTokenMock.mockImplementation(() => {
      throw new Error("Token inválido o expirado");
    });

    const response = await request(app)
      .post("/auth/verify")
      .send({ token: "bad-token" });

    expect(response.status).toBe(401);
    expect(response.body.valid).toBe(false);
    expect(response.body.message).toBe("Token inválido o expirado");
  });

  it("POST /auth/verify returns 400 when token is missing", async () => {
    const response = await request(app)
      .post("/auth/verify")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details[0]).toContain("token:");
  });

  it("GET /auth/me returns current user for a valid bearer token", async () => {
    const token = jwt.sign(
      {
        sub: "user-5",
        email: "user5@escuelaenfermeria.com.uy",
        name: "Current User",
        picture: "https://example.com/avatar-5.png",
      },
      config.jwt.secret,
    );

    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: "user-5",
      email: "user5@escuelaenfermeria.com.uy",
      name: "Current User",
      picture: "https://example.com/avatar-5.png",
    });
  });

  it("GET /auth/me returns 401 when token is missing", async () => {
    const response = await request(app)
      .get("/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("No se proporcionó token de autenticación");
  });

  it("GET /auth/me returns 401 for malformed or invalid token", async () => {
    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", "Bearer not-a-jwt");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Token inválido o expirado");
  });

  it("GET /auth/me returns 403 for token with unauthorized domain", async () => {
    const token = jwt.sign(
      {
        sub: "user-6",
        email: "user6@gmail.com",
        name: "External User",
      },
      config.jwt.secret,
    );

    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Dominio de correo no autorizado");
  });
});
