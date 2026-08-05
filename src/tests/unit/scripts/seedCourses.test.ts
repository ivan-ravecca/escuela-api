import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  initializeDatabase: vi.fn(),
  resetDatabase: vi.fn(),
  closePool: vi.fn(),
  createCourse: vi.fn(),
  getAllCourses: vi.fn(),
}));

vi.mock("../../../database/connection", () => ({
  initializeDatabase: mocks.initializeDatabase,
  resetDatabase: mocks.resetDatabase,
  closePool: mocks.closePool,
}));

vi.mock("../../../database/courseRepository", () => ({
  CourseRepository: {
    createCourse: mocks.createCourse,
    getAllCourses: mocks.getAllCourses,
  },
}));

import { sampleCourses, seedDatabase } from "../../../scripts/seedCourses";

describe("seedDatabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createCourse.mockImplementation(async (course) => ({
      id: 1,
      ...course,
    }));
    mocks.getAllCourses.mockResolvedValue(sampleCourses);
  });

  it("resets database before inserting sample data by default", async () => {
    await seedDatabase();

    expect(mocks.initializeDatabase).toHaveBeenCalledTimes(1);
    expect(mocks.resetDatabase).toHaveBeenCalledTimes(1);
    expect(mocks.createCourse).toHaveBeenCalledTimes(sampleCourses.length);
    expect(mocks.closePool).toHaveBeenCalledTimes(1);
  });

  it("can seed without resetting existing data", async () => {
    await seedDatabase({ reset: false });

    expect(mocks.initializeDatabase).toHaveBeenCalledTimes(1);
    expect(mocks.resetDatabase).not.toHaveBeenCalled();
    expect(mocks.createCourse).toHaveBeenCalledTimes(sampleCourses.length);
    expect(mocks.closePool).toHaveBeenCalledTimes(1);
  });

  it("closes the pool when seeding fails", async () => {
    mocks.createCourse.mockRejectedValueOnce(new Error("insert failed"));

    await expect(seedDatabase()).rejects.toThrow("insert failed");
    expect(mocks.closePool).toHaveBeenCalledTimes(1);
  });
});