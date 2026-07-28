import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app";
import {
  resetAssistantControllerDependencies,
  setAssistantControllerDependencies,
} from "../../src/controllers/assistantController";

describe("Assistant integration routes", () => {
  const app = createApp();
  const resendSendMock = vi.fn();

  beforeEach(() => {
    resendSendMock.mockReset();
    setAssistantControllerDependencies({
      resendClient: {
        emails: {
          send: resendSendMock,
        },
      },
    });
  });

  afterEach(() => {
    resetAssistantControllerDependencies();
  });

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

  it("POST /assistant/interest rejects requests without CSRF token", async () => {
    const response = await request(app).post("/assistant/interest").send({
      name: "Ana",
      phone: "+598 99 000 111",
      email: "ana@example.com",
      course_id: 1,
      course_name: "Primeros Auxilios",
    });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("INVALID_CSRF_TOKEN");
  });

  it("POST /assistant/interest returns 200 and success payload when email is sent", async () => {
    resendSendMock.mockResolvedValue({ id: "email-1" });

    const agent = request.agent(app);
    const csrfResponse = await agent.get("/assistant/csrf-token");

    const response = await agent
      .post("/assistant/interest")
      .set("x-csrf-token", csrfResponse.body.csrfToken)
      .send({
        name: "Ana",
        phone: "+598 99 000 111",
        email: "ana@example.com",
        course_id: 1,
        course_name: "Primeros Auxilios",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain("Gracias por tu interés");
    expect(resendSendMock).toHaveBeenCalledTimes(1);
  });

  it("POST /assistant/interest returns 500 when email provider fails", async () => {
    resendSendMock.mockRejectedValue(new Error("provider down"));

    const agent = request.agent(app);
    const csrfResponse = await agent.get("/assistant/csrf-token");

    const response = await agent
      .post("/assistant/interest")
      .set("x-csrf-token", csrfResponse.body.csrfToken)
      .send({
        name: "Ana",
        phone: "+598 99 000 111",
        email: "ana@example.com",
        course_id: 1,
        course_name: "Primeros Auxilios",
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe("Failed to process interest capture");
    expect(response.body.message).toBe("provider down");
  });
});
