import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getPool } from "./connection";
import { Course, CourseInput } from "../types/course";

export class CourseRepository {
  static async getAllCourses(): Promise<Course[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      "SELECT * FROM courses ORDER BY category, name"
    );
    return rows as Course[];
  }

  static async getCourseById(id: number): Promise<Course | undefined> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      "SELECT * FROM courses WHERE id = ?",
      [id]
    );
    return rows[0] as Course | undefined;
  }

  static async getCoursesByCategory(category: string): Promise<Course[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      "SELECT * FROM courses WHERE category = ? ORDER BY name",
      [category]
    );
    return rows as Course[];
  }

  static async getCoursesByModality(modality: string): Promise<Course[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      "SELECT * FROM courses WHERE modality = ? ORDER BY category, name",
      [modality]
    );
    return rows as Course[];
  }

  static async createCourse(course: CourseInput): Promise<Course> {
    const [result] = await getPool().query<ResultSetHeader>(
      `INSERT INTO courses (name, url, description, duration_hours, modality, requirements, 
                          syllabus_summary, schedule, category, job_opportunities)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        course.name,
        course.url,
        course.description,
        course.duration_hours,
        course.modality,
        course.requirements,
        course.syllabus_summary,
        course.schedule || null,
        course.category,
        course.job_opportunities,
      ]
    );

    return (await this.getCourseById(result.insertId))!;
  }

  static async updateCourse(
    id: number,
    course: Partial<CourseInput>
  ): Promise<Course | undefined> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(course).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return this.getCourseById(id);
    }

    values.push(id);

    await getPool().query(
      `UPDATE courses 
       SET ${fields.join(", ")}
       WHERE id = ?`,
      values
    );

    return this.getCourseById(id);
  }

  static async deleteCourse(id: number): Promise<boolean> {
    const [result] = await getPool().query<ResultSetHeader>(
      "DELETE FROM courses WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  static async searchCourses(searchTerm: string): Promise<Course[]> {
    const term = `%${searchTerm}%`;
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT * FROM courses 
       WHERE name LIKE ? 
          OR description LIKE ? 
          OR syllabus_summary LIKE ?
       ORDER BY category, name`,
      [term, term, term]
    );
    return rows as Course[];
  }
}

