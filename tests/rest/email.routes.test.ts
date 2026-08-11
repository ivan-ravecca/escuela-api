import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app";

describe("Email routes", () => {
  it("POST /email/send should return 202 with valid payload", async () => {
    const response = await request(app).post("/email/send").send({
      name: "Ivan",
      email: "ivan@example.com",
      message: "Hola, me interesa la escuela.",
    });

    expect(response.status).toBe(202);
  });

  it("POST /email/inquire should return 202 with valid payload", async () => {
    const response = await request(app).post("/email/inquire").send({
      name: "Ivan",
      email: "ivan@example.com",
      phone: "099123123",
      course: "Auxiliar de Enfermeria",
      ci: "12345678",
      year: "2024",
      inquire: "certificado",
    });

    expect(response.status).toBe(202);
  });

  it("POST /email/send should return 400 with invalid payload", async () => {
    const response = await request(app).post("/email/send").send({
      name: "",
      email: "not-an-email",
      message: "",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation failed");
  });
});
