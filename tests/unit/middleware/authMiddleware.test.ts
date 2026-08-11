import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";
import { authMiddleware, domainMiddleware } from "../../../src/middleware/authMiddleware";

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

describe("authMiddleware", () => {
  it("should return 401 when auth header is missing", () => {
    const req: any = { headers: {} };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "No se proporcionó token de autenticación",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should attach user and call next when token is valid", () => {
    vi.mocked(jwt.verify).mockReturnValue({
      sub: "user-1",
      email: "dev@example.com",
      name: "Dev User",
      picture: "https://example.com/pic.png",
    } as any);

    const req: any = {
      headers: { authorization: "Bearer valid-token" },
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual({
      id: "user-1",
      email: "dev@example.com",
      name: "Dev User",
      picture: "https://example.com/pic.png",
    });
  });

  it("should return 403 when email domain is not allowed", () => {
    vi.mocked(jwt.verify).mockReturnValue({
      sub: "user-1",
      email: "dev@other-domain.com",
      name: "Dev User",
      picture: "https://example.com/pic.png",
    } as any);

    const req: any = {
      headers: { authorization: "Bearer valid-token" },
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Dominio de correo no autorizado",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when token verification fails", () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error("invalid token");
    });

    const req: any = {
      headers: { authorization: "Bearer invalid-token" },
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token inválido o expirado" });
    expect(next).not.toHaveBeenCalled();
  });

  it("domainMiddleware should return 401 when user is missing", () => {
    const req: any = {};
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    domainMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("domainMiddleware should return 403 for unauthorized domain", () => {
    const req: any = {
      user: { email: "user@other.com" },
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    domainMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("domainMiddleware should call next for allowed domain", () => {
    const req: any = {
      user: { email: "user@example.com" },
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    domainMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
