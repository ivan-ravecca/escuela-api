import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";

describe("Assistant integration routes", () => {
  const app = createApp();

  it("POST /assistant/chat rejects requests without CSRF token", async () => {
    const response = await request(app)
      .post("/assistant/chat")
      .send({ message: "hola", conversation_history: [] });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("INVALID_CSRF_TOKEN");
  });

  it("GET /assistant/csrf-token returns a token", async () => {
    const response = await request(app).get("/assistant/csrf-token");

    expect(response.status).toBe(200);
    expect(response.body.csrfToken).toBeTypeOf("string");
  });
});
