import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../services/authService", () => ({
  verifyGoogleToken: vi.fn(),
  getUserInfoFromAccessToken: vi.fn(),
  generateToken: vi.fn(),
  verifyToken: vi.fn(),
}));

import * as authController from "../../../controllers/authController";
import * as authService from "../../../services/authService";

const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
};

describe("authController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("login returns 400 when token is missing", async () => {
    const req = { body: {} } as any;
    const res = createMockResponse() as any;

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("login returns token and user for valid google token", async () => {
    vi.mocked(authService.verifyGoogleToken).mockResolvedValue({
      id: "u1",
      email: "user@escuelaenfermeria.com.uy",
      name: "User",
      picture: "pic",
    });
    vi.mocked(authService.generateToken).mockReturnValue("jwt-token");

    const req = { body: { googleToken: "google-token" } } as any;
    const res = createMockResponse() as any;

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        token: "jwt-token",
        user: expect.objectContaining({
          email: "user@escuelaenfermeria.com.uy",
        }),
      }),
    );
  });

  it("login falls back to access token when id token verification fails", async () => {
    vi.mocked(authService.verifyGoogleToken).mockRejectedValue(new Error("bad id token"));
    vi.mocked(authService.getUserInfoFromAccessToken).mockResolvedValue({
      id: "u2",
      email: "user@escuelaenfermeria.com.uy",
      name: "Fallback User",
      picture: "pic",
    });
    vi.mocked(authService.generateToken).mockReturnValue("jwt-fallback");

    const req = { body: { googleToken: "access-token" } } as any;
    const res = createMockResponse() as any;

    await authController.login(req, res);

    expect(authService.getUserInfoFromAccessToken).toHaveBeenCalledWith("access-token");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("login returns 401 when both id token and access token fail", async () => {
    vi.mocked(authService.verifyGoogleToken).mockRejectedValue(new Error("bad id token"));
    vi.mocked(authService.getUserInfoFromAccessToken).mockRejectedValue(new Error("bad access"));

    const req = { body: { googleToken: "invalid" } } as any;
    const res = createMockResponse() as any;

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("verifyToken returns 401 when service throws", () => {
    vi.mocked(authService.verifyToken).mockImplementation(() => {
      throw new Error("Token invalido");
    });

    const req = { body: { token: "bad-token" } } as any;
    const res = createMockResponse() as any;

    authController.verifyToken(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        valid: false,
      }),
    );
  });

  it("verifyToken returns 403 for disallowed domain", () => {
    vi.mocked(authService.verifyToken).mockReturnValue({
      id: "u1",
      email: "user@other.com",
      name: "User",
      picture: "pic",
    });

    const req = { body: { token: "good" } } as any;
    const res = createMockResponse() as any;

    authController.verifyToken(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("verifyToken returns valid true for allowed domain", () => {
    vi.mocked(authService.verifyToken).mockReturnValue({
      id: "u1",
      email: "user@escuelaenfermeria.com.uy",
      name: "User",
      picture: "pic",
    });

    const req = { body: { token: "good" } } as any;
    const res = createMockResponse() as any;

    authController.verifyToken(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        valid: true,
      }),
    );
  });

  it("getCurrentUser returns 401 when user is missing", () => {
    const req = {} as any;
    const res = createMockResponse() as any;

    authController.getCurrentUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("getCurrentUser returns current user data", () => {
    const req = {
      user: {
        id: "u1",
        email: "user@escuelaenfermeria.com.uy",
        name: "User",
        picture: "pic",
      },
    } as any;
    const res = createMockResponse() as any;

    authController.getCurrentUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "u1",
        email: "user@escuelaenfermeria.com.uy",
      }),
    );
  });
});
