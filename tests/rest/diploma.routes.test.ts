import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../src/app";

describe("Diploma routes", () => {
  it("GET /diploma should return not allowed message", async () => {
    const response = await request(app).get("/diploma");

    expect(response.status).toBe(200);
    expect(response.text).toBe("You cannot GET diploma");
  });

  it("GET /diploma/generate should require auth token", async () => {
    const response = await request(app).get("/diploma/generate");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("No se proporcionó token de autenticación");
  });

  it("GET /diploma/:diplomaId should return 400 for invalid hash", async () => {
    const response = await request(app).get("/diploma/hash-invalido");

    expect(response.status).toBe(400);
    expect(response.text).toBe("ID de diploma inválido");
  });
});
