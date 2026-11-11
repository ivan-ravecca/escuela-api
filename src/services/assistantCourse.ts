import { AssistantCourse } from "../types/course";
import { SiteCourse } from "../types/siteCourse";
import { htmlToText } from "./htmlToText";

export function toAssistantCourse(course: SiteCourse, siteUrl: string): AssistantCourse {
  return {
    id: course.id,
    name: course.title,
    url: new URL(course.path, siteUrl).toString(),
    description: htmlToText(course.info),
    duration_text: course.term,
    requirements: course.requirements,
    ...(course.openRegistration && { open_registration: htmlToText(course.openRegistration) }),
    ...(course.durationHours !== null && { duration_hours: course.durationHours }),
    ...(course.modality !== null && { modality: course.modality }),
    ...(course.category !== null && { category: course.category }),
    ...(course.syllabusSummary
      ? { syllabus_summary: course.syllabusSummary }
      : course.curriculum ? { syllabus_summary: htmlToText(course.curriculum) } : {}),
    ...(course.schedule !== null && { schedule: course.schedule }),
    ...(course.jobOpportunities !== null && { job_opportunities: course.jobOpportunities }),
  };
}
