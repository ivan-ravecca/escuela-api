// AI Assistant - Course Catalog Seeder

import { initializeDatabase } from "../database/connection";
import { CourseRepository } from "../database/courseRepository";
import { CourseInput } from "../types/course";

const sampleCourses: CourseInput[] = [
  {
    name: "Auxiliar de Enfermería",
    url: "https://escuelaenfermeria.com.uy/cursos/auxiliar-enfermeria",
    description:
      "Formación básica en enfermería para comenzar tu carrera en el área de la salud. Aprenderás técnicas de cuidado básico, higiene, movilización de pacientes y asistencia en procedimientos médicos.",
    duration_hours: 400,
    modality: "presencial",
    requirements:
      "Primaria completa (6to año), edad mínima 18 años, certificado de salud.",
    syllabus_summary:
      "Anatomía básica, signos vitales, higiene y confort del paciente, administración de medicamentos, primeros auxilios, ética profesional.",
    schedule: "Lunes a viernes de 9:00 a 13:00 o de 18:00 a 22:00",
    category: "inicial",
    job_opportunities:
      "Hospitales públicos y privados, clínicas, sanatorios, centros geriátricos, home care, residencias de ancianos.",
  },
  {
    name: "Enfermería Profesional",
    url: "https://escuelaenfermeria.com.uy/cursos/enfermeria-profesional",
    description:
      "Carrera completa de enfermería con título habilitante para ejercer como enfermero/a profesional. Formación integral teórico-práctica en todas las áreas de la enfermería.",
    duration_hours: 2400,
    modality: "presencial",
    requirements:
      "Secundaria completa (bachillerato), Auxiliar de Enfermería aprobado, edad mínima 18 años.",
    syllabus_summary:
      "Enfermería médico-quirúrgica, pediatría, obstetricia, salud mental, cuidados críticos, farmacología avanzada, administración en salud.",
    schedule: "3 años - Lunes a viernes de 8:00 a 17:00",
    category: "avanzado",
    job_opportunities:
      "Enfermero profesional en hospitales, clínicas, CTI, quirófanos, emergencias, coordinador de equipos de enfermería.",
  },
  {
    name: "Cuidados Paliativos",
    url: "https://escuelaenfermeria.com.uy/cursos/cuidados-paliativos",
    description:
      "Especialización en el cuidado integral de pacientes con enfermedades terminales y sus familias. Enfoque en manejo del dolor, apoyo emocional y calidad de vida.",
    duration_hours: 120,
    modality: "semipresencial",
    requirements:
      "Ser Auxiliar de Enfermería o Enfermero Profesional con experiencia mínima de 1 año.",
    syllabus_summary:
      "Control de síntomas, manejo del dolor, comunicación con paciente y familia, aspectos éticos y legales, duelo, trabajo en equipo interdisciplinario.",
    schedule: "2 sábados al mes de 8:00 a 18:00 + plataforma online",
    category: "especializacion",
    job_opportunities:
      "Unidades de cuidados paliativos, equipos de home care, hospitales, ONGs especializadas.",
  },
  {
    name: "Enfermería Pediátrica",
    url: "https://escuelaenfermeria.com.uy/cursos/enfermeria-pediatrica",
    description:
      "Especialización en el cuidado de niños desde recién nacidos hasta adolescentes. Aprenderás técnicas específicas para el cuidado infantil y comunicación con la familia.",
    duration_hours: 180,
    modality: "presencial",
    requirements:
      "Auxiliar de Enfermería o Enfermero Profesional, preferentemente con experiencia.",
    syllabus_summary:
      "Desarrollo infantil, vacunación, cuidados neonatales, pediatría clínica, emergencias pediátricas, ludoterapia, comunicación con niños y padres.",
    schedule: "3 meses - Martes y jueves de 18:00 a 22:00",
    category: "especializacion",
    job_opportunities:
      "Servicios de pediatría hospitalarios, clínicas pediátricas, centros de vacunación, guarderías especializadas.",
  },
  {
    name: "Primeros Auxilios y RCP",
    url: "https://escuelaenfermeria.com.uy/cursos/primeros-auxilios",
    description:
      "Curso intensivo de primeros auxilios y reanimación cardiopulmonar. Ideal para cualquier persona que quiera aprender a actuar en emergencias.",
    duration_hours: 20,
    modality: "presencial",
    requirements: "Ninguno. Abierto al público general.",
    syllabus_summary:
      "Evaluación de la escena, RCP adultos y niños, uso de DEA, atragantamientos, hemorragias, fracturas, quemaduras, crisis convulsivas.",
    schedule: "1 fin de semana intensivo - Sábado y domingo de 9:00 a 18:00",
    category: "inicial",
    job_opportunities:
      "Certificación útil para cualquier profesión, requisito en empresas, escuelas, clubes deportivos, eventos masivos.",
  },
  {
    name: "Geriatría y Gerontología",
    url: "https://escuelaenfermeria.com.uy/cursos/geriatria",
    description:
      "Especialización en el cuidado de adultos mayores. Enfoque en las particularidades del envejecimiento, enfermedades frecuentes y cuidados específicos.",
    duration_hours: 150,
    modality: "semipresencial",
    requirements: "Auxiliar de Enfermería o Enfermero Profesional.",
    syllabus_summary:
      "Proceso de envejecimiento, síndromes geriátricos, demencias, caídas, úlceras por presión, polifarmacia, nutrición en el adulto mayor, actividades de la vida diaria.",
    schedule: "4 meses - 1 sábado al mes presencial + plataforma online",
    category: "especializacion",
    job_opportunities:
      "Residencias geriátricas, servicios de geriatría hospitalarios, home care especializado, centros de día.",
  },
  {
    name: "Instrumentación Quirúrgica",
    url: "https://escuelaenfermeria.com.uy/cursos/instrumentacion-quirurgica",
    description:
      "Formación especializada para asistir en procedimientos quirúrgicos. Aprenderás sobre instrumental, técnicas de esterilización y asistencia en cirugías.",
    duration_hours: 300,
    modality: "presencial",
    requirements:
      "Auxiliar de Enfermería con secundaria completa. Deseable experiencia en área quirúrgica.",
    syllabus_summary:
      "Anatomía quirúrgica, instrumental quirúrgico, técnicas de esterilización, asepsia y antisepsia, cirugía general, traumatología, ginecología.",
    schedule: "6 meses - Lunes a viernes de 8:00 a 12:00",
    category: "especializacion",
    job_opportunities:
      "Bloques quirúrgicos de hospitales y clínicas, instrumentista en cirugías, central de esterilización.",
  },
];

async function seedDatabase() {
  console.log("Starting database seed...");

  try {
    // Initialize database tables
    await initializeDatabase();

    for (const course of sampleCourses) {
      const created = await CourseRepository.createCourse(course);
      console.log(`✓ Created course: ${created.name}`);
    }

    console.log("\n✅ Database seeded successfully!");
    const allCourses = await CourseRepository.getAllCourses();
    console.log(`Total courses: ${allCourses.length}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run seeder
seedDatabase();
