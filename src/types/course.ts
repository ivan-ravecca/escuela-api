export interface Course {
  id: number;
  name: string;
  url: string;
  description: string;
  duration_hours: number;
  modality: "presencial" | "virtual" | "semipresencial";
  requirements: string;
  syllabus_summary: string;
  schedule?: string;
  category: "inicial" | "avanzado" | "especializacion";
  job_opportunities: string;
  created_at?: string;
  updated_at?: string;
}

export interface CourseInput {
  name: string;
  url: string;
  description: string;
  duration_hours: number;
  modality: "presencial" | "virtual" | "semipresencial";
  requirements: string;
  syllabus_summary: string;
  schedule?: string;
  category: "inicial" | "avanzado" | "especializacion";
  job_opportunities: string;
}

export interface AssistantCourse {
  id: string;
  name: string;
  url: string;
  description: string;
  duration_text: string;
  duration_hours?: number;
  modality?: Course["modality"];
  requirements: string[];
  open_registration?: string;
  syllabus_summary?: string;
  schedule?: string;
  category?: Course["category"];
  job_opportunities?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  conversation_history?: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  recommended_courses?: AssistantCourse[];
}

export interface LeadCaptureRequest {
  name: string;
  phone: string;
  email?: string;
  course_id: string | number;
  course_name: string;
}
