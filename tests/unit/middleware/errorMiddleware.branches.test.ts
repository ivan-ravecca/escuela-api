import { describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../../src/middleware/errorMiddleware";

describe("errorMiddleware branches", () => {
  it("should fallback to status 500 and default message", () => {
    const req: any = {};
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    errorHandler({} as any, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Error interno del servidor" }),
    );
  });
});
