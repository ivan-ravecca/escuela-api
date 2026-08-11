import { describe, expect, it, vi } from "vitest";

vi.mock("../../../src/services/authService", () => ({
  verifyGoogleToken: vi.fn(),
  getUserInfoFromAccessToken: vi.fn(),
  generateToken: vi.fn(),
  verifyToken: vi.fn(),
}));

import * as authService from "../../../src/services/authService";
import { getCurrentUser, verifyToken } from "../../../src/controllers/authController";

describe("authController branches", () => {
  it("verifyToken should return 400 when token is missing", () => {
    const req: any = { body: {} };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    verifyToken(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Token no proporcionado" });
  });

  it("verifyToken should return 403 for unauthorized domain", () => {
    vi.mocked(authService.verifyToken).mockReturnValue({
      id: "u1",
      email: "user@other.com",
      name: "User",
    } as any);

    const req: any = { body: { token: "jwt" } };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    verifyToken(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("verifyToken should return 401 on service error", () => {
    vi.mocked(authService.verifyToken).mockImplementation(() => {
      throw new Error("bad token");
    });

    const req: any = { body: { token: "jwt" } };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    verifyToken(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ valid: false }),
    );
  });

  it("getCurrentUser should return 401 when req.user is missing", () => {
    const req: any = {};
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    getCurrentUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No autenticado" });
  });
});
