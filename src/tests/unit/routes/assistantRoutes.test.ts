import express from "express";
import request from "supertest";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  welcome: vi.fn((req: any, res: any) => res.status(200).json({ message: "welcome" })),
  chat: vi.fn((req: any, res: any) => res.status(200).json({ response: "ok", recommended_courses: [] })),
  captureInterest: vi.fn((req: any, res: any) => res.status(200).json({ success: true })),
  generateToken: vi.fn(() => "csrf-token"),
}));

vi.mock("../../../controllers/assistantController", () => ({
  AssistantController: {
    welcome: mocks.welcome,
    chat: mocks.chat,
    captureInterest: mocks.captureInterest,
  },
}));

vi.mock("../../../middleware/csrfMiddleware", () => ({
  generateToken: mocks.generateToken,
  validateRequest: (req: any, res: any, next: any) => next(),
}));

import assistantRoutes from "../../../routes/assistantRoutes";

describe("assistantRoutes", () => {
  const createTestApp = () => {
    const app = express();
    app.use(express.json());
    app.use("/assistant", assistantRoutes);
    return app;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /assistant/welcome returns welcome payload", async () => {
    const app = createTestApp();
    const response = await request(app).get("/assistant/welcome");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("welcome");
  });

  it("GET /assistant/csrf-token returns generated token", async () => {
    const app = createTestApp();
    const response = await request(app).get("/assistant/csrf-token");

    expect(response.status).toBe(200);
    expect(response.body.csrfToken).toBe("csrf-token");
    expect(mocks.generateToken).toHaveBeenCalledTimes(1);
  });

  it("POST /assistant/chat validates schema", async () => {
    const app = createTestApp();
    const badResponse = await request(app).post("/assistant/chat").send({});
    expect(badResponse.status).toBe(400);

    const okResponse = await request(app)
      .post("/assistant/chat")
      .send({ message: "hola", conversation_history: [] });

    expect(okResponse.status).toBe(200);
    expect(mocks.chat).toHaveBeenCalledTimes(1);
  });

  it("POST /assistant/chat enforces rate limit", async () => {
    const app = createTestApp();
    let gotRateLimited = false;

    for (let i = 0; i < 10; i += 1) {
      const res = await request(app)
        .post("/assistant/chat")
        .send({ message: `hola-${i}`, conversation_history: [] });

      if (res.status === 429) {
        gotRateLimited = true;
        break;
      }
    }

    if (!gotRateLimited) {
      const limited = await request(app)
        .post("/assistant/chat")
        .send({ message: "hola-11", conversation_history: [] });

      gotRateLimited = limited.status === 429;
    }

    expect(gotRateLimited).toBe(true);
  });

  it("POST /assistant/interest validates schema", async () => {
    const app = createTestApp();
    const response = await request(app)
      .post("/assistant/interest")
      .send({ name: "x" });

    expect(response.status).toBe(400);
  });
});
