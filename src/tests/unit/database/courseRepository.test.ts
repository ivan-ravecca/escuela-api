import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();
const poolMock = { query: queryMock };

vi.mock("../../../database/connection", () => ({
  getPool: vi.fn(() => poolMock),
}));

import { CourseRepository } from "../../../database/courseRepository";

describe("CourseRepository", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("getAllCourses returns rows", async () => {
    const rows = [{ id: 1, name: "Curso 1" }];
    queryMock.mockResolvedValue([rows]);

    const result = await CourseRepository.getAllCourses();

    expect(result).toEqual(rows);
    expect(queryMock).toHaveBeenCalledWith(
      "SELECT * FROM courses ORDER BY category, name",
    );
  });

  it("getCourseById returns first row", async () => {
    const rows = [{ id: 5, name: "Curso 5" }];
    queryMock.mockResolvedValue([rows]);

    const result = await CourseRepository.getCourseById(5);

    expect(result).toEqual(rows[0]);
  });

  it("getCoursesByCategory filters by category", async () => {
    const rows = [{ id: 1, category: "inicial" }];
    queryMock.mockResolvedValue([rows]);

    const result = await CourseRepository.getCoursesByCategory("inicial");

    expect(result).toEqual(rows);
    expect(queryMock).toHaveBeenCalledWith(
      "SELECT * FROM courses WHERE category = ? ORDER BY name",
      ["inicial"],
    );
  });

  it("getCoursesByModality filters by modality", async () => {
    const rows = [{ id: 1, modality: "virtual" }];
    queryMock.mockResolvedValue([rows]);

    const result = await CourseRepository.getCoursesByModality("virtual");

    expect(result).toEqual(rows);
  });

  it("createCourse inserts and returns created entity", async () => {
    queryMock
      .mockResolvedValueOnce([{ insertId: 55 }])
      .mockResolvedValueOnce([[{ id: 55, name: "New" }]]);

    const result = await CourseRepository.createCourse({
      name: "New",
      url: "https://example.com",
      description: "desc",
      duration_hours: 10,
      modality: "virtual",
      requirements: "none",
      syllabus_summary: "summary",
      schedule: "mon",
      category: "inicial",
      job_opportunities: "jobs",
    });

    expect(result).toEqual({ id: 55, name: "New" });
  });

  it("updateCourse returns current course when no fields are provided", async () => {
    queryMock.mockResolvedValueOnce([[{ id: 9, name: "Current" }]]);

    const result = await CourseRepository.updateCourse(9, {});

    expect(result).toEqual({ id: 9, name: "Current" });
  });

  it("updateCourse updates and returns new data when fields exist", async () => {
    queryMock
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([[{ id: 9, name: "Updated" }]]);

    const result = await CourseRepository.updateCourse(9, { name: "Updated" });

    expect(result).toEqual({ id: 9, name: "Updated" });
    expect(queryMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("UPDATE courses"),
      ["Updated", 9],
    );
  });

  it("deleteCourse returns false when nothing is deleted", async () => {
    queryMock.mockResolvedValue([{ affectedRows: 0 }]);

    const result = await CourseRepository.deleteCourse(99);

    expect(result).toBe(false);
  });

  it("searchCourses uses wildcard term", async () => {
    queryMock.mockResolvedValue([[]]);

    await CourseRepository.searchCourses("enfermeria");

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("WHERE name LIKE ?"),
      ["%enfermeria%", "%enfermeria%", "%enfermeria%"],
    );
  });

  it("deleteCourse returns true when a row is deleted", async () => {
    queryMock.mockResolvedValue([{ affectedRows: 1 }]);

    const result = await CourseRepository.deleteCourse(1);

    expect(result).toBe(true);
  });
});
