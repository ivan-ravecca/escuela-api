import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../database/courseRepository", () => ({
  CourseRepository: {
    getAllCourses: vi.fn(),
    getCourseById: vi.fn(),
    getCoursesByCategory: vi.fn(),
    getCoursesByModality: vi.fn(),
    searchCourses: vi.fn(),
  },
}));

import courseRoutes from "../../../routes/courseRoutes";
import { CourseRepository } from "../../../database/courseRepository";

describe("courseRoutes", () => {
  const app = express();
  app.use("/courses", courseRoutes);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /courses returns list", async () => {
    vi.mocked(CourseRepository.getAllCourses).mockResolvedValue([
      { id: 1, name: "Curso 1" } as any,
    ]);

    const response = await request(app).get("/courses");

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
  });

  it("GET /courses/:id returns 404 when no course", async () => {
    vi.mocked(CourseRepository.getCourseById).mockResolvedValue(undefined);

    const response = await request(app).get("/courses/999");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Course not found");
  });

  it("GET /courses/:id returns course when found", async () => {
    vi.mocked(CourseRepository.getCourseById).mockResolvedValue({ id: 2, name: "Curso 2" } as any);

    const response = await request(app).get("/courses/2");

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(2);
  });

  it("GET /courses returns 500 when repository fails", async () => {
    vi.mocked(CourseRepository.getAllCourses).mockRejectedValue(new Error("db failed"));

    const response = await request(app).get("/courses");

    expect(response.status).toBe(500);
  });

  it("GET /courses/search/:query delegates to repository", async () => {
    vi.mocked(CourseRepository.searchCourses).mockResolvedValue([]);

    const response = await request(app).get("/courses/search/wound");

    expect(response.status).toBe(200);
    expect(CourseRepository.searchCourses).toHaveBeenCalledWith("wound");
  });

  it("GET /courses/category/:category delegates to repository", async () => {
    vi.mocked(CourseRepository.getCoursesByCategory).mockResolvedValue([{ id: 1 } as any]);

    const response = await request(app).get("/courses/category/inicial");

    expect(response.status).toBe(200);
    expect(CourseRepository.getCoursesByCategory).toHaveBeenCalledWith("inicial");
  });

  it("GET /courses/modality/:modality delegates to repository", async () => {
    vi.mocked(CourseRepository.getCoursesByModality).mockResolvedValue([{ id: 1 } as any]);

    const response = await request(app).get("/courses/modality/virtual");

    expect(response.status).toBe(200);
    expect(CourseRepository.getCoursesByModality).toHaveBeenCalledWith("virtual");
  });
});
