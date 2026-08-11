import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { validate, validateRequest } from "../../../src/middleware/validateMiddleware";

describe("validate middleware", () => {
  it("should pass and coerce req.body when schema is valid", () => {
    const middleware = validate(
      z.object({
        name: z.string(),
        age: z.number(),
      }),
    );

    const req: any = { body: { name: "Ivan", age: 30 } };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ name: "Ivan", age: 30 });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 400 with formatted errors when schema is invalid", () => {
    const middleware = validate(
      z.object({
        name: z.string().min(1),
      }),
    );

    const req: any = { body: { name: "" } };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it("validateRequest should validate body/query/params and call next", () => {
    const middleware = validateRequest({
      body: z.object({ name: z.string() }),
      query: z.object({ page: z.string() }),
      params: z.object({ id: z.string() }),
    });

    const req: any = {
      body: { name: "Ivan" },
      query: { page: "1" },
      params: { id: "10" },
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("validateRequest should return 400 with grouped errors", () => {
    const middleware = validateRequest({
      body: z.object({ name: z.string().min(2) }),
      query: z.object({ page: z.string().regex(/^\d+$/) }),
      params: z.object({ id: z.string().regex(/^\d+$/) }),
    });

    const req: any = {
      body: { name: "" },
      query: { page: "x" },
      params: { id: "abc" },
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Validation failed" }),
    );
  });
});
