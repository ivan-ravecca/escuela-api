import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app";

const { getAllCoursesMock, getCourseByIdMock, searchCoursesMock, getCoursesByCategoryMock, getCoursesByModalityMock } = vi.hoisted(() => ({
  getAllCoursesMock: vi.fn(),
  getCourseByIdMock: vi.fn(),
  searchCoursesMock: vi.fn(),
  getCoursesByCategoryMock: vi.fn(),
  getCoursesByModalityMock: vi.fn(),
}));

vi.mock("../../src/database/courseRepository", () => ({
  CourseRepository: {
    getAllCourses: getAllCoursesMock,
    getCourseById: getCourseByIdMock,
    searchCourses: searchCoursesMock,
    getCoursesByCategory: getCoursesByCategoryMock,
    getCoursesByModality: getCoursesByModalityMock,
  },
}));

describe("Courses integration routes", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /courses returns the course list", async () => {
    getAllCoursesMock.mockResolvedValue([{ id: 1, name: "Enfermería Básica" }]);

    const response = await request(app).get("/courses");

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.courses[0].name).toBe("Enfermería Básica");
  });

  it("GET /courses/:id returns 404 when the course does not exist", async () => {
    getCourseByIdMock.mockResolvedValue(null);

    const response = await request(app).get("/courses/999");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Course not found");
  });

  it("GET /courses/search/:query returns matches", async () => {
    searchCoursesMock.mockResolvedValue([{ id: 2, name: "Curso de Emergencias" }]);

    const response = await request(app).get("/courses/search/emergencias");

    expect(response.status).toBe(200);
    expect(response.body.query).toBe("emergencias");
    expect(response.body.courses[0].name).toContain("Emergencias");
  });
});
