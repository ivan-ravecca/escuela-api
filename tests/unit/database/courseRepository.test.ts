import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
}));

vi.mock("../../../src/database/connection", () => {
  return {
    getPool: vi.fn(() => ({
      query: mocks.query,
    })),
  };
});

import { CourseRepository } from "../../../src/database/courseRepository";

describe("CourseRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAllCourses should return rows", async () => {
    mocks.query.mockResolvedValueOnce([[{ id: 1 }]]);
    const result = await CourseRepository.getAllCourses();
    expect(result).toEqual([{ id: 1 }]);
  });

  it("getCourseById should return first row", async () => {
    mocks.query.mockResolvedValueOnce([[{ id: 2 }]]);
    const result = await CourseRepository.getCourseById(2);
    expect(result).toEqual({ id: 2 });
  });

  it("getCoursesByCategory should return rows", async () => {
    mocks.query.mockResolvedValueOnce([[{ category: "inicial" }]]);
    const result = await CourseRepository.getCoursesByCategory("inicial");
    expect(result).toEqual([{ category: "inicial" }]);
  });

  it("getCoursesByModality should return rows", async () => {
    mocks.query.mockResolvedValueOnce([[{ modality: "presencial" }]]);
    const result = await CourseRepository.getCoursesByModality("presencial");
    expect(result).toEqual([{ modality: "presencial" }]);
  });

  it("createCourse should insert and return created entity", async () => {
    mocks.query
      .mockResolvedValueOnce([{ insertId: 10 }])
      .mockResolvedValueOnce([[{ id: 10, name: "Auxiliar" }]]);

    const result = await CourseRepository.createCourse({
      name: "Auxiliar",
      url: "https://example.com",
      description: "Desc",
      duration_hours: 100,
      modality: "presencial",
      requirements: "Ninguno",
      syllabus_summary: "Resumen",
      schedule: "Nocturno",
      category: "inicial",
      job_opportunities: "Clinicas",
    });

    expect(result).toEqual({ id: 10, name: "Auxiliar" });
  });

  it("updateCourse should return existing course when no fields provided", async () => {
    mocks.query.mockResolvedValueOnce([[{ id: 4, name: "Base" }]]);

    const result = await CourseRepository.updateCourse(4, {});

    expect(result).toEqual({ id: 4, name: "Base" });
  });

  it("updateCourse should update and return updated record", async () => {
    mocks.query
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([[{ id: 5, name: "Updated" }]]);

    const result = await CourseRepository.updateCourse(5, { name: "Updated" } as any);

    expect(result).toEqual({ id: 5, name: "Updated" });
  });

  it("deleteCourse should return true when affectedRows > 0", async () => {
    mocks.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const result = await CourseRepository.deleteCourse(3);
    expect(result).toBe(true);
  });

  it("searchCourses should return rows", async () => {
    mocks.query.mockResolvedValueOnce([[{ id: 1, name: "Auxiliar" }]]);
    const result = await CourseRepository.searchCourses("aux");
    expect(result).toEqual([{ id: 1, name: "Auxiliar" }]);
  });
});
