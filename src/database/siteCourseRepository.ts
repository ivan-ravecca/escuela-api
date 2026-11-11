import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getPool } from "./connection";
import { SiteCourse, SiteCourseImage, SiteCourseInput } from "../types/siteCourse";

interface CourseRow extends RowDataPacket {
  record_id: number;
  slug: string;
  title: string;
  term: string;
  open_registration: string;
  info: string;
  curriculum: string | null;
  requirements: string;
  images: string;
  most_wanted: number;
  short_course: number;
  master_class: number;
  sort_order: number;
  menu_order: number;
  most_wanted_order: number;
  short_course_order: number;
  master_class_order: number;
  published: number;
  duration_hours: number | null;
  modality: SiteCourseInput["modality"];
  category: SiteCourseInput["category"];
  syllabus_summary: string | null;
  schedule: string | null;
  job_opportunities: string | null;
}

const selectCourses = `
  SELECT c.*, c.id AS record_id, s.slug
  FROM site_courses c JOIN site_course_slugs s ON s.course_id = c.id AND s.is_current = 1
`;

function mapCourse(row: CourseRow): SiteCourse {
  return {
    recordId: row.record_id,
    id: row.slug,
    path: `/cursos/${row.slug}`,
    title: row.title,
    term: row.term,
    openRegistration: row.open_registration,
    info: row.info,
    curriculum: row.curriculum,
    requirements: JSON.parse(row.requirements) as string[],
    images: JSON.parse(row.images) as SiteCourseImage[],
    mostWanted: Boolean(row.most_wanted),
    shortCourse: Boolean(row.short_course),
    masterClass: Boolean(row.master_class),
    sortOrder: row.sort_order,
    menuOrder: row.menu_order,
    menuPositions: {
      mostWanted: Math.max(1, row.most_wanted_order),
      shortCourse: Math.max(1, row.short_course_order),
      masterClass: Math.max(1, row.master_class_order),
    },
    published: Boolean(row.published),
    durationHours: row.duration_hours,
    modality: row.modality,
    category: row.category,
    syllabusSummary: row.syllabus_summary,
    schedule: row.schedule,
    jobOpportunities: row.job_opportunities,
  };
}

function values(course: SiteCourseInput) {
  return [
    course.title, course.term, course.openRegistration, course.info,
    course.curriculum, JSON.stringify(course.requirements), JSON.stringify(course.images),
    course.mostWanted, course.shortCourse, course.masterClass, course.sortOrder, course.menuOrder,
    course.menuPositions?.mostWanted ?? course.menuOrder,
    course.menuPositions?.shortCourse ?? course.menuOrder,
    course.menuPositions?.masterClass ?? course.menuOrder,
    course.published, course.durationHours, course.modality, course.category,
    course.syllabusSummary, course.schedule, course.jobOpportunities,
  ];
}

const columns = [
  "title", "term", "open_registration", "info", "curriculum", "requirements",
  "images", "most_wanted", "short_course", "master_class", "sort_order", "menu_order",
  "most_wanted_order", "short_course_order", "master_class_order",
  "published", "duration_hours", "modality", "category", "syllabus_summary",
  "schedule", "job_opportunities",
];

const menuGroups = [
  { flag: "most_wanted", order: "most_wanted_order", key: "mostWanted" },
  { flag: "short_course", order: "short_course_order", key: "shortCourse" },
  { flag: "master_class", order: "master_class_order", key: "masterClass" },
] as const;

function withPositions(rows: CourseRow[]): SiteCourse[] {
  const courses = rows.map(mapCourse);
  const published = rows.filter((row) => row.published);
  const byId = new Map(courses.map((course) => [course.recordId, course]));
  published.forEach((row, index) => { byId.get(row.record_id)!.sortOrder = index + 1; });
  for (const group of menuGroups) {
    const members = published.filter((row) => row[group.flag])
      .sort((a, b) => a[group.order] - b[group.order] || a.sort_order - b.sort_order || a.record_id - b.record_id);
    members.forEach((row, index) => { byId.get(row.record_id)!.menuPositions![group.key] = index + 1; });
  }
  return courses;
}

async function reorder(connection: PoolConnection, before: CourseRow[], id: number, course: SiteCourseInput) {
  const published = before.filter((row) => row.published && row.record_id !== id);
  const insertAtPosition = (ids: number[], position: number) => {
    ids.splice(Math.max(0, Math.min(position - 1, ids.length)), 0, id);
  };
  const listing = published.map((row) => row.record_id);
  if (course.published) insertAtPosition(listing, course.sortOrder);
  for (const [index, courseId] of listing.entries()) {
    await connection.query("UPDATE site_courses SET sort_order = ? WHERE id = ?", [index + 1, courseId]);
  }
  for (const group of menuGroups) {
    const members = published.filter((row) => row[group.flag])
      .sort((a, b) => a[group.order] - b[group.order] || a.sort_order - b.sort_order || a.record_id - b.record_id)
      .map((row) => row.record_id);
    if (course.published && course[group.key]) {
      insertAtPosition(members, course.menuPositions?.[group.key] ?? course.menuOrder);
    }
    for (const [index, courseId] of members.entries()) {
      await connection.query(`UPDATE site_courses SET ${group.order} = ? WHERE id = ?`, [index + 1, courseId]);
    }
  }
}

async function lockCatalog(connection: PoolConnection): Promise<CourseRow[]> {
  const [state] = await connection.query<RowDataPacket[]>(
    "SELECT id FROM site_catalog_state WHERE id = 1 FOR UPDATE"
  );
  if (!state.length) throw new Error("Missing site catalog revision");
  const [rows] = await connection.query<CourseRow[]>(`${selectCourses} ORDER BY c.sort_order, c.id`);
  return rows;
}

export class SiteCourseRepository {
  static async list(includeUnpublished = false): Promise<SiteCourse[]> {
    const [rows] = await getPool().query<CourseRow[]>(
      `${selectCourses} ${includeUnpublished ? "" : "WHERE c.published = 1"} ORDER BY c.sort_order, c.id`
    );
    return withPositions(rows);
  }

  static async getByRecordId(id: number, connection?: PoolConnection): Promise<SiteCourse | undefined> {
    const [rows] = await (connection || getPool()).query<CourseRow[]>(
      `${selectCourses} WHERE c.id = ?`, [id]
    );
    return rows[0] ? mapCourse(rows[0]) : undefined;
  }

  static async getBySlug(slug: string): Promise<SiteCourse | undefined> {
    const [rows] = await getPool().query<CourseRow[]>(
      `${selectCourses}
       JOIN site_course_slugs requested ON requested.course_id = c.id
       WHERE requested.slug = ? AND c.published = 1`, [slug]
    );
    if (!rows[0]) return undefined;
    return (await this.list()).find((course) => course.recordId === rows[0].record_id);
  }

  static async create(course: SiteCourseInput): Promise<SiteCourse> {
    const connection = await getPool().getConnection();
    try {
      await connection.beginTransaction();
      const before = await lockCatalog(connection);
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO site_courses (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`,
        values(course)
      );
      await connection.query(
        "INSERT INTO site_course_slugs (slug,course_id,is_current) VALUES (?, ?, 1)",
        [course.id, result.insertId]
      );
      await reorder(connection, before, result.insertId, course);
      await connection.query("UPDATE site_catalog_state SET revision = revision + 1 WHERE id = 1");
      const created = await this.getByRecordId(result.insertId, connection);
      if (!created) throw new Error("Created course could not be loaded");
      await connection.commit();
      return created;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async update(id: number, course: SiteCourseInput): Promise<SiteCourse | undefined> {
    const connection = await getPool().getConnection();
    try {
      await connection.beginTransaction();
      const before = await lockCatalog(connection);
      const [rows] = await connection.query<RowDataPacket[]>(
        "SELECT id FROM site_courses WHERE id = ? FOR UPDATE", [id]
      );
      if (!rows.length) {
        await connection.rollback();
        return undefined;
      }
      const [slugRows] = await connection.query<RowDataPacket[]>(
        "SELECT course_id FROM site_course_slugs WHERE slug = ? FOR UPDATE", [course.id]
      );
      if (slugRows.length && slugRows[0].course_id !== id) {
        const conflict = new Error("El ID ya está en uso");
        Object.assign(conflict, { code: "ER_DUP_ENTRY" });
        throw conflict;
      }
      await connection.query("UPDATE site_course_slugs SET is_current = 0 WHERE course_id = ?", [id]);
      if (slugRows.length) {
        await connection.query("UPDATE site_course_slugs SET is_current = 1 WHERE slug = ?", [course.id]);
      } else {
        await connection.query(
          "INSERT INTO site_course_slugs (slug,course_id,is_current) VALUES (?, ?, 1)",
          [course.id, id]
        );
      }
      await connection.query(
        `UPDATE site_courses SET ${columns.map((column) => `${column} = ?`).join(",")} WHERE id = ?`,
        [...values(course), id]
      );
      await reorder(connection, before, id, course);
      await connection.query("UPDATE site_catalog_state SET revision = revision + 1 WHERE id = 1");
      const updated = await this.getByRecordId(id, connection);
      if (!updated) throw new Error("Updated course could not be loaded");
      await connection.commit();
      return updated;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
