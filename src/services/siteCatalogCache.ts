import { RowDataPacket } from "mysql2/promise";
import { getPool } from "../database/connection";
import { SiteCourseRepository } from "../database/siteCourseRepository";
import { SiteCourse } from "../types/siteCourse";

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface AssistantCatalog {
  courses: SiteCourse[];
  stale: boolean;
}

export class CatalogUnavailableError extends Error {
  constructor() {
    super("El catálogo de cursos no está disponible.");
    this.name = "CatalogUnavailableError";
  }
}

export function createAssistantCatalogCache(
  readRevision: () => Promise<string>,
  readCourses: () => Promise<SiteCourse[]>,
  now: () => number = Date.now,
) {
  let cache: { revision: string; loadedAt: number; courses: SiteCourse[] } | undefined;
  let refresh: Promise<void> | undefined;

  return async (): Promise<AssistantCatalog> => {
    try {
      let revision = await readRevision();
      while (true) {
        if (refresh) {
          await refresh;
          revision = await readRevision();
          continue;
        }
        if (cache && cache.revision === revision && now() - cache.loadedAt < MAX_AGE_MS) {
          return { courses: cache.courses, stale: false };
        }
        refresh = (async () => {
          const courses = await readCourses();
          cache = { revision, loadedAt: now(), courses };
        })();
        try {
          await refresh;
        } finally {
          refresh = undefined;
        }
      }
    } catch (error) {
      console.error("No se pudo actualizar el catálogo del asistente:", error);
      if (cache && now() - cache.loadedAt <= MAX_AGE_MS) {
        return { courses: cache.courses, stale: true };
      }
      throw new CatalogUnavailableError();
    }
  };
}

export const getAssistantCatalog = createAssistantCatalogCache(
  async () => {
    const [rows] = await getPool().query<RowDataPacket[]>(
      "SELECT revision FROM site_catalog_state WHERE id = 1"
    );
    if (!rows[0]) throw new Error("Missing site catalog revision");
    return String(rows[0].revision);
  },
  () => SiteCourseRepository.list(),
);
