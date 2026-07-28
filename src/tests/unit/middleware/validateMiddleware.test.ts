import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { validate, validateRequest } from "../../../middleware/validateMiddleware";

const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
};

describe("validateMiddleware", () => {
  it("validates body and calls next", () => {
    const schema = z.object({ name: z.string().min(1) });
    const middleware = validate(schema);
    const req = { body: { name: "Ivan" } } as any;
    const res = createMockResponse() as any;
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 400 when body is invalid", () => {
    const schema = z.object({ name: z.string().min(3) });
    const middleware = validate(schema);
    const req = { body: { name: "ab" } } as any;
    const res = createMockResponse() as any;
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Validation failed",
      }),
    );
  });

  it("validates body, query and params together", () => {
    const middleware = validateRequest({
      body: z.object({ active: z.boolean() }),
      query: z.object({ limit: z.coerce.number().int().positive() }),
      params: z.object({ id: z.string().regex(/^\d+$/) }),
    });

    const req = {
      body: { active: true },
      query: { limit: "10" },
      params: { id: "22" },
    } as any;
    const res = createMockResponse() as any;
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.query.limit).toBe(10);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 400 with sectioned errors in validateRequest", () => {
    const middleware = validateRequest({
      body: z.object({ active: z.boolean() }),
      query: z.object({ limit: z.coerce.number().int().positive() }),
      params: z.object({ id: z.string().regex(/^\d+$/) }),
    });

    const req = {
      body: { active: "yes" },
      query: { limit: "-1" },
      params: { id: "abc" },
    } as any;
    const res = createMockResponse() as any;
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Validation failed",
        details: expect.objectContaining({
          body: expect.any(Array),
          query: expect.any(Array),
          params: expect.any(Array),
        }),
      }),
    );
  });
});
