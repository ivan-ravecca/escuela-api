import { Router } from "express";
import config from "../config";
import { SiteCourseRepository } from "../database/siteCourseRepository";
import { htmlToText } from "../services/htmlToText";
import { SiteCourse } from "../types/siteCourse";

const router = Router();

function legacyCourse(course: SiteCourse) {
  return {
    id: course.recordId,
    name: course.title,
    url: new URL(course.path, config.cors.siteUrl).toString(),
    description: htmlToText(course.info),
    duration_hours: course.durationHours,
    modality: course.modality,
    requirements: course.requirements.join("\n"),
    syllabus_summary: course.syllabusSummary,
    schedule: course.schedule,
    category: course.category,
    job_opportunities: course.jobOpportunities,
  };
}

router.get("/", async (_req, res, next) => {
  try {
    const courses = (await SiteCourseRepository.list()).map(legacyCourse);
    res.json({ courses, total: courses.length });
  } catch (error) {
    next(error);
  }
});

router.get("/search/:query", async (req, res, next) => {
  try {
    const query = req.params.query.toLocaleLowerCase();
    const courses = (await SiteCourseRepository.list()).map(legacyCourse).filter((course) =>
      [course.name, course.description, course.syllabus_summary || ""]
        .some((value) => value.toLocaleLowerCase().includes(query))
    );
    res.json({ courses, total: courses.length, query: req.params.query });
  } catch (error) {
    next(error);
  }
});

router.get("/category/:category", async (req, res, next) => {
  try {
    const courses = (await SiteCourseRepository.list()).map(legacyCourse)
      .filter((course) => course.category === req.params.category);
    res.json({ courses, total: courses.length, category: req.params.category });
  } catch (error) {
    next(error);
  }
});

router.get("/modality/:modality", async (req, res, next) => {
  try {
    const courses = (await SiteCourseRepository.list()).map(legacyCourse)
      .filter((course) => course.modality === req.params.modality);
    res.json({ courses, total: courses.length, modality: req.params.modality });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid course ID" });
      return;
    }
    const course = await SiteCourseRepository.getByRecordId(id);
    if (!course || !course.published) {
      res.status(404).json({ error: "Course not found" });
      return;
    }
    res.json(legacyCourse(course));
  } catch (error) {
    next(error);
  }
});

export default router;
