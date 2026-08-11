import { describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../../src/middleware/errorMiddleware";

describe("errorMiddleware", () => {
  it("should respond with provided statusCode and message", () => {
    const req: any = {};
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    errorHandler(
      { message: "Boom", statusCode: 418 } as any,
      req,
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "error", message: "Boom" }),
    );
  });
});
