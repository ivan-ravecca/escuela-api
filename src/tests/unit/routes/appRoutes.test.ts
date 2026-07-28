import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../../app";

describe("app routes", () => {
  const app = createApp();

  it("GET /health returns success payload", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBe("API is running");
  });

  it("GET /auth/me returns 401 without token", async () => {
    const response = await request(app).get("/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/token/i);
  });
});
