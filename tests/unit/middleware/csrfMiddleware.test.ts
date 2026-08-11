import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generateCsrfToken: vi.fn(),
  doubleCsrfProtection: vi.fn(),
}));

vi.mock("csrf-csrf", () => {
  return {
    doubleCsrf: vi.fn(() => ({
      generateCsrfToken: mocks.generateCsrfToken,
      doubleCsrfProtection: mocks.doubleCsrfProtection,
    })),
  };
});

import { generateToken, validateRequest } from "../../../src/middleware/csrfMiddleware";

describe("csrfMiddleware", () => {
  it("generateToken should call library token generator", () => {
    mocks.generateCsrfToken.mockReturnValue("csrf-token-value");

    const token = generateToken({} as any, {} as any);

    expect(token).toBe("csrf-token-value");
    expect(mocks.generateCsrfToken).toHaveBeenCalledOnce();
  });

  it("validateRequest should call next when token is valid", () => {
    mocks.doubleCsrfProtection.mockImplementation((req, res, callback) => {
      callback();
    });

    const req: any = {};
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    validateRequest(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("validateRequest should return 403 when token is invalid", () => {
    mocks.doubleCsrfProtection.mockImplementation((req, res, callback) => {
      callback(new Error("bad csrf"));
    });

    const req: any = {};
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    validateRequest(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "INVALID_CSRF_TOKEN" }),
    );
  });
});
