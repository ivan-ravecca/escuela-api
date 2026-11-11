import { RowDataPacket } from "mysql2/promise";
import { getPool } from "../database/connection";
import { SiteCourseRepository } from "../database/siteCourseRepository";
import { SiteCourse } from "../types/siteCourse";

let cache: { revision: string; expiresAt: number; courses: SiteCourse[] } | undefined;

export async function getAssistantCatalog(): Promise<SiteCourse[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT revision FROM site_catalog_state WHERE id = 1"
  );
  if (!rows[0]) throw new Error("Missing site catalog revision");
  const revision = String(rows[0].revision);
  if (cache && cache.revision === revision && Date.now() < cache.expiresAt) {
    return cache.courses;
  }
  const courses = await SiteCourseRepository.list();
  cache = { revision, courses, expiresAt: Date.now() + 24 * 60 * 60 * 1000 };
  return courses;
}
