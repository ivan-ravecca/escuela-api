import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = {
      send: mocks.send,
    };
  },
}));

import emailRoutes from "../../../routes/email";

describe("emailRoutes", () => {
  const createTestApp = () => {
    const app = express();
    app.use(express.json());
    app.use("/email", emailRoutes);
    return app;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /email/send returns 202 on success", async () => {
    const app = createTestApp();
    mocks.send.mockResolvedValue({ id: "mail-1" });

    const response = await request(app).post("/email/send").send({
      name: "Juan",
      email: "juan@example.com",
      message: "Hola",
    });

    expect(response.status).toBe(202);
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });

  it("POST /email/send returns 500 on provider error", async () => {
    const app = createTestApp();
    mocks.send.mockRejectedValue(new Error("send failed"));

    const response = await request(app).post("/email/send").send({
      name: "Juan",
      email: "juan@example.com",
      message: "Hola",
    });

    expect(response.status).toBe(500);
    expect(response.text).toContain("Error sending email: send failed");
  });

  it("POST /email/inquire validates body", async () => {
    const app = createTestApp();
    const response = await request(app).post("/email/inquire").send({
      name: "Juan",
    });

    expect(response.status).toBe(400);
  });

  it("POST /email/inquire returns 202 on success", async () => {
    const app = createTestApp();
    mocks.send.mockResolvedValue({ id: "mail-2" });

    const response = await request(app).post("/email/inquire").send({
      name: "Juan",
      email: "juan@example.com",
      phone: "099123456",
      course: "Curso",
      ci: "12345678",
      year: "2024",
      inquire: "constancia",
    });

    expect(response.status).toBe(202);
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });

  it("POST /email/inquire returns 500 on provider error", async () => {
    const app = createTestApp();
    mocks.send.mockRejectedValue(new Error("inquire failed"));

    const response = await request(app).post("/email/inquire").send({
      name: "Juan",
      email: "juan@example.com",
      phone: "099123456",
      course: "Curso",
      ci: "12345678",
      year: "2024",
      inquire: "constancia",
    });

    expect(response.status).toBe(500);
    expect(response.text).toContain("inquire failed");
  });
});
