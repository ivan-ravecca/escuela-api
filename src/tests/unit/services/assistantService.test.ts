import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  anthropicCreate: vi.fn(),
  getAllCourses: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = {
      create: mocks.anthropicCreate,
    };
  },
}));

vi.mock("../../../database/courseRepository", () => ({
  CourseRepository: {
    getAllCourses: mocks.getAllCourses,
  },
}));

import { AssistantService } from "../../../services/assistantService";

describe("assistantService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAllCourses.mockResolvedValue([
      {
        id: 1,
        name: "Curso Enfermeria Basica",
        url: "https://example.com",
      },
    ]);
  });

  it("chat returns response and matched recommended courses", async () => {
    mocks.anthropicCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: "Te recomiendo Curso Enfermeria Basica por tu perfil.",
        },
      ],
    });

    const service = new AssistantService();
    const result = await service.chat("hola", []);

    expect(result.response).toContain("Curso Enfermeria Basica");
    expect(result.recommendedCourses).toHaveLength(1);
  });

  it("chat maps status 529 to AI_OVERLOADED", async () => {
    mocks.anthropicCreate.mockRejectedValue({ status: 529 });

    const service = new AssistantService();

    await expect(service.chat("hola", [])).rejects.toThrow("AI_OVERLOADED");
  });

  it("chat returns generic error for unknown provider failures", async () => {
    mocks.anthropicCreate.mockRejectedValue(new Error("provider down"));

    const service = new AssistantService();

    await expect(service.chat("hola", [])).rejects.toThrow(
      "Failed to generate response from assistant",
    );
  });
});
