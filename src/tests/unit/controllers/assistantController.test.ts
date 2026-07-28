import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AssistantController,
  resetAssistantControllerDependencies,
  setAssistantControllerDependencies,
} from "../../../controllers/assistantController";

const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
};

describe("AssistantController", () => {
  beforeEach(() => {
    resetAssistantControllerDependencies();
    vi.clearAllMocks();
  });

  it("chat returns 400 when conversation exceeds max size", async () => {
    setAssistantControllerDependencies({
      assistantService: {
        chat: vi.fn(),
        generateWelcomeMessage: vi.fn(),
      },
    });

    const req = {
      body: {
        message: "a",
        conversation_history: [{ role: "user", content: "b".repeat(40000) }],
      },
    } as any;
    const res = createMockResponse() as any;

    await AssistantController.chat(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("chat returns 503 for AI_OVERLOADED", async () => {
    setAssistantControllerDependencies({
      assistantService: {
        chat: vi.fn().mockRejectedValue(new Error("AI_OVERLOADED")),
        generateWelcomeMessage: vi.fn(),
      },
    });

    const req = {
      body: {
        message: "hola",
        conversation_history: [],
      },
    } as any;
    const res = createMockResponse() as any;

    await AssistantController.chat(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "AI_OVERLOADED",
      }),
    );
  });

  it("captureInterest rejects invalid phone", async () => {
    const req = {
      body: {
        name: "Juan",
        phone: "abc",
        email: "juan@example.com",
        course_id: 1,
        course_name: "Curso",
      },
    } as any;
    const res = createMockResponse() as any;

    await AssistantController.captureInterest(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("captureInterest sends email using injected resend client", async () => {
    const send = vi.fn().mockResolvedValue({});

    setAssistantControllerDependencies({
      resendClient: {
        emails: { send },
      },
      assistantService: {
        chat: vi.fn(),
        generateWelcomeMessage: vi.fn(),
      },
    });

    const req = {
      body: {
        name: "<b>Juan</b>",
        phone: "+598 99 123 456",
        email: "juan@example.com",
        course_id: 1,
        course_name: "<script>x</script>Curso",
      },
    } as any;
    const res = createMockResponse() as any;

    await AssistantController.captureInterest(req, res);

    expect(send).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = send.mock.calls[0][0] as any;
    expect(payload.subject).not.toContain("<script>");
  });
});
