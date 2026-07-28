import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

import jwt from "jsonwebtoken";
import { authMiddleware, domainMiddleware } from "../../../middleware/authMiddleware";

const mockedJwt = jwt as unknown as { verify: ReturnType<typeof vi.fn> };

const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
};

describe("authMiddleware", () => {
  beforeEach(() => {
    mockedJwt.verify.mockReset();
  });

  it("returns 401 when Authorization header is missing", () => {
    const req = { headers: {} } as any;
    const res = createMockResponse() as any;
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 403 for disallowed email domain", () => {
    mockedJwt.verify.mockReturnValue({
      sub: "u1",
      email: "user@other-domain.com",
      name: "User",
    });

    const req = {
      headers: { authorization: "Bearer token" },
    } as any;
    const res = createMockResponse() as any;
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("attaches user and calls next for valid token", () => {
    mockedJwt.verify.mockReturnValue({
      sub: "u1",
      email: "user@escuelaenfermeria.com.uy",
      name: "User",
      picture: "pic",
    });

    const req = {
      headers: { authorization: "Bearer token" },
    } as any;
    const res = createMockResponse() as any;
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({
      id: "u1",
      email: "user@escuelaenfermeria.com.uy",
      name: "User",
      picture: "pic",
    });
  });

  it("returns 401 when jwt verification throws", () => {
    mockedJwt.verify.mockImplementation(() => {
      throw new Error("invalid jwt");
    });

    const req = {
      headers: { authorization: "Bearer bad-token" },
    } as any;
    const res = createMockResponse() as any;
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Token inválido o expirado",
      }),
    );
  });
});

describe("domainMiddleware", () => {
  it("returns 401 when req.user is absent", () => {
    const req = {} as any;
    const res = createMockResponse() as any;
    const next = vi.fn();

    domainMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("calls next when user domain is valid", () => {
    const req = {
      user: {
        id: "u1",
        email: "user@escuelaenfermeria.com.uy",
        name: "User",
      },
    } as any;
    const res = createMockResponse() as any;
    const next = vi.fn();

    domainMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("returns 403 when user domain is invalid", () => {
    const req = {
      user: {
        id: "u1",
        email: "user@other-domain.com",
        name: "User",
      },
    } as any;
    const res = createMockResponse() as any;
    const next = vi.fn();

    domainMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
