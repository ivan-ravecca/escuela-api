import { describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../../middleware/errorMiddleware";

const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
};

describe("errorMiddleware", () => {
  it("returns 500 when statusCode is missing", () => {
    const error = new Error("boom");
    const req = {} as any;
    const res = createMockResponse() as any;

    errorHandler(error, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
        message: "boom",
      }),
    );
  });

  it("uses explicit statusCode", () => {
    const error = Object.assign(new Error("forbidden"), { statusCode: 403 });
    const req = {} as any;
    const res = createMockResponse() as any;

    errorHandler(error, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
