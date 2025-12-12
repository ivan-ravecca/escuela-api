import mysql from "mysql2/promise";
import config from "../config";

let pool: mysql.Pool | null = null;

export const getPool = (): mysql.Pool => {
  if (!pool) {
    pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }
  return pool;
};

export const initializeDatabase = async (): Promise<void> => {
  const connection = await getPool().getConnection();
  
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        description TEXT NOT NULL,
        duration_hours INT NOT NULL,
        modality ENUM('presencial', 'virtual', 'semipresencial') NOT NULL,
        requirements TEXT NOT NULL,
        syllabus_summary TEXT NOT NULL,
        schedule TEXT,
        category ENUM('inicial', 'avanzado', 'especializacion') NOT NULL,
        job_opportunities TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_courses_category (category),
        INDEX idx_courses_modality (modality)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("✅ Database tables initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  } finally {
    connection.release();
  }
};

export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};
