import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/database/courseRepository", () => {
  return {
    CourseRepository: {
      getAllCourses: vi.fn().mockResolvedValue([
        {
          id: 1,
          name: "Auxiliar de Enfermeria",
          url: "https://example.com/curso",
          description: "Curso inicial",
          duration_hours: 120,
          modality: "presencial",
          requirements: "Ninguno",
          syllabus_summary: "Resumen",
          schedule: "Nocturno",
          category: "inicial",
          job_opportunities: "Clinicas",
        },
      ]),
    },
  };
});

import { app } from "../../src/app";

describe("Assistant routes", () => {
  it("GET /assistant/welcome should return welcome message", async () => {
    const response = await request(app).get("/assistant/welcome");

    expect(response.status).toBe(200);
    expect(response.body.message).toContain("asistente virtual");
  });

  it("GET /assistant/csrf-token should return csrf token and cookie", async () => {
    const response = await request(app).get("/assistant/csrf-token");

    expect(response.status).toBe(200);
    expect(response.body.csrfToken).toBeDefined();
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("POST /assistant/chat should return 403 without csrf token", async () => {
    const response = await request(app).post("/assistant/chat").send({
      message: "hola",
      conversation_history: [],
    });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("INVALID_CSRF_TOKEN");
  });

  it("POST /assistant/chat should return 200 with valid csrf token", async () => {
    const tokenResponse = await request(app).get("/assistant/csrf-token");
    const csrfToken = tokenResponse.body.csrfToken;
    const cookies = tokenResponse.headers["set-cookie"];

    const response = await request(app)
      .post("/assistant/chat")
      .set("x-csrf-token", csrfToken)
      .set("Cookie", cookies)
      .send({
        message: "hola, quiero estudiar",
        conversation_history: [],
      });

    expect(response.status).toBe(200);
    expect(response.body.response).toBeDefined();
    expect(Array.isArray(response.body.recommended_courses)).toBe(true);
  });

  it("POST /assistant/interest should return 400 with invalid phone", async () => {
    const tokenResponse = await request(app).get("/assistant/csrf-token");
    const csrfToken = tokenResponse.body.csrfToken;
    const cookies = tokenResponse.headers["set-cookie"];

    const response = await request(app)
      .post("/assistant/interest")
      .set("x-csrf-token", csrfToken)
      .set("Cookie", cookies)
      .send({
        name: "Ivan",
        phone: "invalid-phone@@@",
        email: "ivan@example.com",
        course_id: 1,
        course_name: "Auxiliar de Enfermeria",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Formato de número de teléfono inválido");
  });

  it("POST /assistant/interest should return 200 with valid data", async () => {
    const tokenResponse = await request(app).get("/assistant/csrf-token");
    const csrfToken = tokenResponse.body.csrfToken;
    const cookies = tokenResponse.headers["set-cookie"];

    const response = await request(app)
      .post("/assistant/interest")
      .set("x-csrf-token", csrfToken)
      .set("Cookie", cookies)
      .send({
        name: "Ivan",
        phone: "+598 99 123 123",
        email: "ivan@example.com",
        course_id: 1,
        course_name: "Auxiliar de Enfermeria",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
