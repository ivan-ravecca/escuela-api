import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFns = vi.hoisted(() => ({
  generateCsrfToken: vi.fn(() => "csrf-token-value"),
  doubleCsrfProtection: vi.fn(
    (req: any, res: any, next: (err?: Error) => void) => next(),
  ),
}));

vi.mock("csrf-csrf", () => ({
  doubleCsrf: vi.fn(() => ({
    generateCsrfToken: mockFns.generateCsrfToken,
    doubleCsrfProtection: mockFns.doubleCsrfProtection,
  })),
}));

import { generateToken, validateRequest } from "../../../middleware/csrfMiddleware";

const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
};

describe("csrfMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generateToken delegates to double csrf token generator", () => {
    const req = {} as any;
    const res = {} as any;

    const token = generateToken(req, res);

    expect(token).toBe("csrf-token-value");
    expect(mockFns.generateCsrfToken).toHaveBeenCalledWith(req, res);
  });

  it("validateRequest calls next when csrf protection passes", () => {
    const req = {} as any;
    const res = createMockResponse() as any;
    const next = vi.fn();

    validateRequest(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("validateRequest returns 403 when csrf protection fails", () => {
    mockFns.doubleCsrfProtection.mockImplementationOnce(
      (req: any, res: any, next: (err?: Error) => void) => next(new Error("csrf")),
    );

    const req = {} as any;
    const res = createMockResponse() as any;
    const next = vi.fn();

    validateRequest(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "INVALID_CSRF_TOKEN",
      }),
    );
  });
});
