import express, { NextFunction, Response, Router } from "express";
import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";
import path from "path";
import { imageSize } from "image-size";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import config from "../config";
import { SiteCourseRepository } from "../database/siteCourseRepository";
import { authMiddleware, domainMiddleware } from "../middleware/authMiddleware";
import { SiteCourseInput } from "../types/siteCourse";

const router = Router();
const imageDimensions = (buffer: Buffer) => imageSize(buffer);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(191);
const optionalText = z.string().max(10000).nullable();
const courseSchema = z.object({
  id: slug,
  title: z.string().trim().min(1).max(255),
  term: z.string().max(10000),
  openRegistration: z.string().max(50000),
  info: z.string().max(100000),
  curriculum: z.string().max(100000).nullable(),
  requirements: z.array(z.string().trim().min(1).max(2000)).max(100),
  images: z.array(z.object({
    src: z.string().regex(/^\/images\/shop\/[a-zA-Z0-9._-]+$/).max(255),
    alt: z.string().max(255),
    isActive: z.boolean(),
  }).strict()).max(30),
  mostWanted: z.boolean(),
  shortCourse: z.boolean(),
  masterClass: z.boolean(),
  sortOrder: z.number().int().min(0).max(1000000),
  menuOrder: z.number().int().min(0).max(1000000),
  menuPositions: z.object({
    mostWanted: z.number().int().min(1).max(1000000),
    shortCourse: z.number().int().min(1).max(1000000),
    masterClass: z.number().int().min(1).max(1000000),
  }).strict().optional(),
  published: z.boolean(),
  durationHours: z.number().int().positive().max(100000).nullable(),
  modality: z.enum(["presencial", "virtual", "semipresencial"]).nullable(),
  category: z.enum(["inicial", "avanzado", "especializacion"]).nullable(),
  syllabusSummary: optionalText,
  schedule: optionalText,
  jobOpportunities: optionalText,
}).strict();

const htmlOptions: sanitizeHtml.IOptions = {
  allowedTags: ["p", "div", "h3", "h4", "h5", "strong", "em", "b", "i", "ul", "ol", "li", "br", "a"],
  allowedAttributes: { a: ["href", "title"], ul: ["class"], ol: ["class"] },
  allowedClasses: { ul: ["check-list", "star-list"], ol: ["check-list", "star-list"] },
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
};

function parseCourse(body: unknown): SiteCourseInput {
  const parsed = courseSchema.parse(body);
  return {
    ...parsed,
    openRegistration: sanitizeHtml(parsed.openRegistration, htmlOptions),
    info: sanitizeHtml(parsed.info, htmlOptions),
    curriculum: parsed.curriculum === null ? null : sanitizeHtml(parsed.curriculum, htmlOptions),
  };
}

function handleError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof z.ZodError) {
    res.status(400).json({ message: "Datos del curso inválidos", issues: error.issues });
  } else if (error instanceof Error && "code" in error && error.code === "ER_DUP_ENTRY") {
    res.status(409).json({ message: "El ID ya está en uso, incluso como URL anterior." });
  } else {
    next(error);
  }
}

router.get("/", async (_req, res, next) => {
  try {
    res.json({ courses: await SiteCourseRepository.list() });
  } catch (error) {
    next(error);
  }
});

router.get("/admin", authMiddleware, domainMiddleware, async (_req, res, next) => {
  try {
    res.json({ courses: await SiteCourseRepository.list(true) });
  } catch (error) {
    next(error);
  }
});

router.post("/images", authMiddleware, domainMiddleware,
  express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "8mb" }),
  async (req, res, next) => {
    try {
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        res.status(400).json({ message: "Seleccione una imagen JPEG, PNG o WebP" });
        return;
      }
      let dimensions: ReturnType<typeof imageDimensions>;
      try {
        dimensions = imageDimensions(req.body);
      } catch {
        res.status(400).json({ message: "La imagen no es válida" });
        return;
      }
      const formats: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      };
      const mime = req.get("Content-Type")?.split(";")[0] || "";
      const extension = formats[mime];
      if (!extension || dimensions.type !== (extension === "jpg" ? "jpg" : extension)
        || !dimensions.width || !dimensions.height
        || dimensions.width * dimensions.height > 40000000) {
        res.status(400).json({ message: "Formato o dimensiones de imagen no válidos" });
        return;
      }
      const directory = config.shopImagesDir || (
        config.server.nodeEnv === "development"
          ? path.resolve(__dirname, "../../../escuela-site/public/images/shop")
          : undefined
      );
      if (!directory || !path.isAbsolute(directory)) {
        throw new Error("SHOP_IMAGES_DIR debe indicar una carpeta absoluta de imágenes");
      }
      const filename = `${randomUUID()}.${extension}`;
      await writeFile(path.join(directory, filename), req.body, { flag: "wx" });
      res.status(201).json({ src: `/images/shop/${filename}` });
    } catch (error) {
      next(error);
    }
  },
);

router.get("/:slug", async (req, res, next) => {
  try {
    const parsedSlug = slug.parse(req.params.slug);
    const course = await SiteCourseRepository.getBySlug(parsedSlug);
    if (!course) {
      res.status(404).json({ message: "Curso no encontrado" });
      return;
    }
    res.json({ course, canonical: course.id === parsedSlug });
  } catch (error) {
    handleError(error, res, next);
  }
});

router.post("/", authMiddleware, domainMiddleware, async (req, res, next) => {
  try {
    res.status(201).json(await SiteCourseRepository.create(parseCourse(req.body)));
  } catch (error) {
    handleError(error, res, next);
  }
});

router.put("/:id", authMiddleware, domainMiddleware, async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const updated = await SiteCourseRepository.update(id, parseCourse(req.body));
    if (!updated) {
      res.status(404).json({ message: "Curso no encontrado" });
      return;
    }
    res.json(updated);
  } catch (error) {
    handleError(error, res, next);
  }
});

export default router;
