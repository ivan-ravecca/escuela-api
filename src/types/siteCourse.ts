export interface SiteCourseImage {
  src: string;
  alt: string;
  isActive: boolean;
}

export interface SiteCourseInput {
  id: string;
  title: string;
  term: string;
  openRegistration: string;
  info: string;
  curriculum: string | null;
  requirements: string[];
  images: SiteCourseImage[];
  mostWanted: boolean;
  shortCourse: boolean;
  masterClass: boolean;
  sortOrder: number;
  menuOrder: number;
  menuPositions?: {
    mostWanted: number;
    shortCourse: number;
    masterClass: number;
  };
  published: boolean;
  durationHours: number | null;
  modality: "presencial" | "virtual" | "semipresencial" | null;
  category: "inicial" | "avanzado" | "especializacion" | null;
  syllabusSummary: string | null;
  schedule: string | null;
  jobOpportunities: string | null;
}

export interface SiteCourse extends SiteCourseInput {
  recordId: number;
  path: string;
}
