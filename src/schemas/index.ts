import { z } from "zod";
import { PROGRAM_OPTION_VALUES } from "../config/programOptions";

// ============================================
// Email Schemas
// ============================================

export const contactEmailSchema = z.object({
  name: z.string().min(1, "Nombre es obligatorio").max(100, "Nombre es demasiado largo"),
  email: z.string().email("Dirección de correo electrónico inválida"),
  message: z
    .string()
    .min(1, "El mensaje es obligatorio")
    .max(2000, "El mensaje es demasiado largo"),
});

export const inquireEmailSchema = z.object({
  name: z.string().min(1, "Nombre es obligatorio").max(100, "Nombre es demasiado largo"),
  email: z.string().email("Dirección de correo electrónico inválida"),
  phone: z.string().min(1, "Teléfono es obligatorio").max(20, "Teléfono es demasiado largo"),
  course: z
    .string()
    .min(1, "Curso es obligatorio")
    .max(200, "Nombre del curso es demasiado largo"),
  ci: z.string().min(1, "CI es obligatorio").max(20, "CI es demasiado largo"),
  year: z.string().max(10, "Año es demasiado largo").optional(),
  inquire: z
    .string()
    .min(1, "Tipo de consulta es obligatorio")
    .max(100, "Tipo de consulta es demasiado largo"),
});

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
  googleToken: z.string().min(1, "Google token is required"),
});

export const verifyTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

// ============================================
// Diploma Schemas
// ============================================

export const generateQRQuerySchema = z.object({
  link: z
    .string()
    .min(1, "Enlace de Google Drive es obligatorio")
    .url("Formato de URL inválido"),
});

export const diplomaIdParamSchema = z.object({
  diplomaId: z.string().min(1, "ID del diploma es obligatorio"),
});

export const certificateSchema = z.object({
  studentName: z
    .string()
    .min(1, "Nombre del estudiante es obligatorio")
    .max(100, "Nombre del estudiante es demasiado largo"),
  courseName: z
    .string()
    .min(1, "Nombre del curso es obligatorio")
    .max(200, "Nombre del curso es demasiado largo"),
  courseDate: z.string().min(1, "Fecha del curso es obligatoria"),
  certMec: z.boolean().optional().default(false),
  driveUrl: z.string().url("URL de Google Drive inválida").optional(),
  programOption: z.enum(PROGRAM_OPTION_VALUES as [string, ...string[]]).optional(),
});

// ============================================
// Assistant Schemas
// ============================================

const conversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(2000, "El contenido del mensaje es demasiado largo"),
});

export const chatSchema = z.object({
  message: z
    .string()
    .min(1, "El mensaje es obligatorio")
    .max(2000, "El mensaje es demasiado largo (máximo 2000 caracteres)"),
  conversation_history: z
    .array(conversationMessageSchema)
    .max(20, "El historial de la conversación es demasiado largo")
    .optional()
    .default([]),
});

export const leadCaptureSchema = z.object({
  name: z.string().min(1, "Nombre es obligatorio").max(100, "Nombre es demasiado largo"),
  phone: z.string().min(1, "Teléfono es obligatorio").max(20, "Teléfono es demasiado largo"),
  email: z.string().email("Dirección de correo electrónico inválida").max(100).optional(),
  course_id: z.number().int().positive("El ID del curso debe ser un número positivo"),
  course_name: z
    .string()
    .min(1, "Nombre del curso es obligatorio")
    .max(200, "Nombre del curso es demasiado largo"),
});

// ============================================
// Course Schemas
// ============================================

export const courseIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "El ID debe ser un número"),
});

export const courseSearchParamSchema = z.object({
  query: z
    .string()
    .min(1, "La consulta de búsqueda es obligatoria")
    .max(100, "La consulta de búsqueda es demasiado larga"),
});

export const courseCategoryParamSchema = z.object({
  category: z.string().min(1, "La categoría es obligatoria"),
});

export const courseModalityParamSchema = z.object({
  modality: z.string().min(1, "La modalidad es obligatoria"),
});

// ============================================
// Type exports (inferred from schemas)
// ============================================

export type ContactEmailInput = z.infer<typeof contactEmailSchema>;
export type InquireEmailInput = z.infer<typeof inquireEmailSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyTokenInput = z.infer<typeof verifyTokenSchema>;
export type CertificateInput = z.infer<typeof certificateSchema>;
export type ChatInput = z.infer<typeof chatSchema>;
export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>;
