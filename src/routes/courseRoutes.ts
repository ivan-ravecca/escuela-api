import { Router, Request, Response } from "express";
import { CourseRepository } from "../database/courseRepository";

const router = Router();

// Get all courses
router.get("/", async (req: Request, res: Response) => {
  try {
    const courses = await CourseRepository.getAllCourses();
    res.status(200).json({ courses, total: courses.length });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// Get course by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const course = await CourseRepository.getCourseById(id);

    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

// Search courses
router.get("/search/:query", async (req: Request, res: Response) => {
  try {
    const { query } = req.params;
    const courses = await CourseRepository.searchCourses(query);
    res.status(200).json({ courses, total: courses.length, query });
  } catch (error) {
    res.status(500).json({ error: "Failed to search courses" });
  }
});

// Filter by category
router.get("/category/:category", async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const courses = await CourseRepository.getCoursesByCategory(category);
    res.status(200).json({ courses, total: courses.length, category });
  } catch (error) {
    res.status(500).json({ error: "Failed to filter courses" });
  }
});

// Filter by modality
router.get("/modality/:modality", async (req: Request, res: Response) => {
  try {
    const { modality } = req.params;
    const courses = await CourseRepository.getCoursesByModality(modality);
    res.status(200).json({ courses, total: courses.length, modality });
  } catch (error) {
    res.status(500).json({ error: "Failed to filter courses" });
  }
});

export default router;
