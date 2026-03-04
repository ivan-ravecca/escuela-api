import Anthropic from "@anthropic-ai/sdk";
import config from "../config";
import { CourseRepository } from "../database/courseRepository";
import { ChatMessage, Course } from "../types/course";

const SYSTEM_PROMPT = `Eres un asistente de orientación académica para un instituto/escuela de enfermería actualmente en escuelaenfermeria.com.uy

TU OBJETIVO:
- Ayudar al usuario a descubrir qué curso o carrera de enfermería (u otros relacionados) encaja mejor con su perfil.
- Recomendar 1 a 3 cursos de un catálogo que recibirás en formato JSON.
- Explicar las recomendaciones de forma clara, breve y amigable, en español rioplatense neutro.

DATOS IMPORTANTES:
- Siempre que te envíen un mensaje, también recibirás un objeto JSON llamado "course_catalog".
- "course_catalog" incluye un array de cursos con información como:
  - id
  - name
  - url del sitio
  - description
  - duration_hours
  - modality (presencial, virtual, semipresencial)
  - requirements
  - syllabus_summary
  - schedule (si estuvieran)
  - category (por ejemplo: inicial, avanzado, especializacion)
  - job_opportunities (texto explicando oportunidades)

REGLAS CLAVE:

1. NUNCA inventes cursos.
   - Solo puedes recomendar cursos que existan en el JSON "course_catalog".
   - Si el usuario pide algo que no existe en el catálogo, proponé lo más parecido posible y avisá que es una alternativa.

2. Haceme SIEMPRE preguntas antes de recomendar:
   - ¿Qué edad tenés?
   - ¿Hasta qué año de secundaria y afines cursaste?
   - ¿Tenés alguna experiencia previa en salud o enfermería?
   - ¿Cuántas horas por semana podrías dedicar al estudio?
   - ¿Preferís cursar de forma presencial, virtual o te da lo mismo?
   - ¿Buscás algo introductorio, o ya trabajás en el área y querés especializarte?
   - ¿Cuál es tu objetivo principal? (conseguir trabajo, mejorar en el actual, cambiar de área, etc.)

   Podés adaptar las preguntas según lo que el usuario ya haya dicho, pero al menos intenta cubrir:
   - experiencia
   - disponibilidad horaria
   - preferencia de modalidad
   - objetivo

3. Uso del catálogo (JSON):
   - Una vez que tengas suficiente información del usuario, analizá el objeto "course_catalog".
   - Filtra primero por:
     - requisitos (no recomiendes cursos para los que no cumple requisitos).
     - modalidad preferida (si indicó una).
     - nivel / categoría aproximada (inicial, avanzado, especialización).
   - Luego priorizá:
     - Duración compatible con las horas que el usuario dice que puede dedicar.
     - Temas que coincidan con sus intereses declarados.
   - Elegí de 1 a 3 cursos máximos para no marear.

4. Formato de la respuesta:
   Responde SIEMPRE en este formato estructurado:

   - Resumen de lo que entendiste del usuario (2-3 frases).
   - Lista de cursos recomendados:
     Para cada curso:
       - Nombre del curso y url
       - Por qué te lo recomiendo (conectando explícitamente con lo que contó el usuario)
       - Duración y modalidad
       - Requisitos importantes (si los hay)
       - Un breve resumen de salida laboral u objetivo del curso
   - NO preguntes si quiere ser contactado:
       El usuario tendrá un botón "Me interesa" en cada curso recomendado

5. Estilo:
   - Tono cercano, empático y profesional.
   - No seas excesivamente largo. Máximo 2-3 párrafos breves + bullets.
   - No uses tecnicismos innecesarios: explicá como si le hablaras a alguien que recién está empezando a investigar qué estudiar.
   - NO uses formato markdown: sin asteriscos (*), sin doble asterisco (**), sin guiones bajos (_), sin almohadillas (#). Usá texto plano únicamente.

6. Si falta información:
   - Si el usuario te pide una recomendación muy rápido (por ejemplo: "decime qué curso hago"), pedile amablemente que te responda 2 o 3 preguntas clave antes de recomendar.
   - No inventes datos que no estén ni en el input del usuario ni en el JSON.

7. Lenguaje:
   - Siempre contestá en español.
   - Podés usar "vos" o "tu", pero mantené coherencia dentro de la conversación.

Recordatorio final:
- Tu valor principal está en unir el perfil del usuario con el contenido de "course_catalog".
- Siempre explica el POR QUÉ de cada recomendación, no solo el nombre del curso.`;

export class AssistantService {
  private client: Anthropic;

  constructor() {
    if (!config.anthropic.apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not configured. Please add it to your .env file."
      );
    }

    this.client = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });

    console.log("✅ Assistant Service initialized with Anthropic API");
  }

  async chat(
    userMessage: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<{ response: string; recommendedCourses: Course[] }> {
    try {
      // Get course catalog
      const courses = await CourseRepository.getAllCourses();
      const catalogContext = JSON.stringify(
        { course_catalog: courses },
        null,
        2
      );

      // Build conversation messages
      const messages: Anthropic.MessageParam[] = [
        ...conversationHistory.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        {
          role: "user",
          content: `${catalogContext}\n\nUsuario: ${userMessage}`,
        },
      ];

      // Call Claude API
      const response = await this.client.messages.create({
        model: config.anthropic.model,
        max_tokens: config.anthropic.maxTokens,
        system: SYSTEM_PROMPT,
        messages,
      });

      const assistantResponse =
        response.content[0].type === "text" ? response.content[0].text : "";

      // Extract recommended course IDs from the response (simple heuristic)
      const recommendedCourses = this.extractRecommendedCourses(
        assistantResponse,
        courses
      );

      return {
        response: assistantResponse,
        recommendedCourses,
      };
    } catch (error: any) {
      console.error("Error calling Claude API:", error);
      
      // Check if it's an Anthropic API error with status code 529 (overloaded)
      if (error?.status === 529 || error?.response?.status === 529) {
        throw new Error("AI_OVERLOADED");
      }
      
      throw new Error("Failed to generate response from assistant");
    }
  }

  private extractRecommendedCourses(
    response: string,
    allCourses: Course[]
  ): Course[] {
    const recommended: Course[] = [];

    // Look for course names in the response
    for (const course of allCourses) {
      if (response.includes(course.name)) {
        recommended.push(course);
      }
    }

    return recommended.slice(0, 3); // Max 3 recommendations
  }

  async generateWelcomeMessage(): Promise<string> {
    return `Hola! 👋 Soy tu asistente virtual de orientación académica de la Escuela de Enfermería.

Estoy acá para ayudarte a encontrar el curso o carrera que mejor se adapte a vos y a tus objetivos. 

Para poder recomendarte las mejores opciones, me gustaría conocerte un poco mejor. ¿Me contás un poco sobre vos? Por ejemplo:
- ¿Qué experiencia tenés en el área de salud o enfermería?
- ¿Cuántas horas por semana podrías dedicar a estudiar?
- ¿Preferís algo presencial, virtual, o te da lo mismo?

Respondeme todo junto y vamos viendo juntos qué te conviene! 😊`;
  }
}

export default AssistantService;
