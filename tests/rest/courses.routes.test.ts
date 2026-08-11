import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/database/courseRepository", () => {
  return {
    CourseRepository: {
      getAllCourses: vi.fn(),
      getCourseById: vi.fn(),
      searchCourses: vi.fn(),
      getCoursesByCategory: vi.fn(),
      getCoursesByModality: vi.fn(),
    },
  };
});

import { CourseRepository } from "../../src/database/courseRepository";
import { app } from "../../src/app";

describe("Course routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /courses should return course list", async () => {
    vi.mocked(CourseRepository.getAllCourses).mockResolvedValue([
      { id: 1, name: "Auxiliar" } as any,
      { id: 2, name: "Pediatria" } as any,
    ]);

    const response = await request(app).get("/courses");

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
    expect(response.body.courses).toHaveLength(2);
  });

  it("GET /courses should return 500 on repository error", async () => {
    vi.mocked(CourseRepository.getAllCourses).mockRejectedValue(new Error("db error"));

    const response = await request(app).get("/courses");

    expect(response.status).toBe(500);
    expect(response.body.error).toBe("Failed to fetch courses");
  });

  it("GET /courses/:id should return 404 when not found", async () => {
    vi.mocked(CourseRepository.getCourseById).mockResolvedValue(undefined);

    const response = await request(app).get("/courses/10");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Course not found");
  });

  it("GET /courses/:id should return course when found", async () => {
    vi.mocked(CourseRepository.getCourseById).mockResolvedValue({
      id: 10,
      name: "Auxiliar",
    } as any);

    const response = await request(app).get("/courses/10");

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(10);
  });

  it("GET /courses/search/:query should return search result", async () => {
    vi.mocked(CourseRepository.searchCourses).mockResolvedValue([
      { id: 1, name: "Auxiliar" } as any,
    ]);

    const response = await request(app).get("/courses/search/aux");

    expect(response.status).toBe(200);
    expect(response.body.query).toBe("aux");
    expect(response.body.total).toBe(1);
  });

  it("GET /courses/category/:category should return filtered result", async () => {
    vi.mocked(CourseRepository.getCoursesByCategory).mockResolvedValue([
      { id: 1, category: "inicial" } as any,
    ]);

    const response = await request(app).get("/courses/category/inicial");

    expect(response.status).toBe(200);
    expect(response.body.category).toBe("inicial");
    expect(response.body.total).toBe(1);
  });

  it("GET /courses/modality/:modality should return filtered result", async () => {
    vi.mocked(CourseRepository.getCoursesByModality).mockResolvedValue([
      { id: 1, modality: "presencial" } as any,
    ]);

    const response = await request(app).get("/courses/modality/presencial");

    expect(response.status).toBe(200);
    expect(response.body.modality).toBe("presencial");
    expect(response.body.total).toBe(1);
  });
});
