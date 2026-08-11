import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app";

describe("REST smoke endpoints", () => {
  it("GET / should return hello world", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.text).toBe("Hello World");
  });

  it("GET /health should return success payload", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBe("API is running");
    expect(response.body.timestamp).toBeDefined();
  });
});
