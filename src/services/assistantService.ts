import Anthropic from "@anthropic-ai/sdk";
import config from "../config";
import { CatalogUnavailableError, getAssistantCatalog } from "./siteCatalogCache";
import { toAssistantCourse } from "./assistantCourse";
import { AssistantCourse, ChatMessage } from "../types/course";

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
  - duration_text y, si está disponible, duration_hours
  - modality (presencial, virtual, semipresencial), si está disponible
  - requirements
  - open_registration (si está disponible)
  - syllabus_summary
  - schedule (si estuvieran)
  - category (por ejemplo: inicial, avanzado, especializacion)
  - job_opportunities (texto explicando oportunidades)

REGLAS CLAVE:

1. NUNCA inventes cursos.
   - Solo puedes recomendar cursos que existan en el JSON "course_catalog".
   - Si el usuario pide algo que no existe en el catálogo, proponé lo más parecido posible y avisá que es una alternativa.

2. Conversación breve:
   - El mensaje de bienvenida ya hizo la pregunta inicial. En cada respuesta posterior
     hacé como máximo 2 preguntas, contando también las preguntas combinadas.
   - Respondé la consulta y recomendá cursos en cuanto haya información suficiente;
     si el usuario ya expresó su interés, ofrecé opciones sin exigir más respuestas.
   - Si es imprescindible aclarar algo para orientar, preguntá solo lo necesario.
     No pidas nuevamente datos que el usuario ya proporcionó.
   - No solicites por rutina edad, estudios, experiencia, horarios y modalidad.
     Podés sugerir una opción e indicar que confirme los requisitos que no conozcas.

3. Uso del catálogo (JSON):
   - Analizá el objeto "course_catalog" y respondé con opciones lo antes posible.
   - Filtra primero por:
     - requisitos (no recomiendes cursos para los que sabés que no cumple requisitos;
       si no sabés si los cumple, indicá los requisitos sin darlo por hecho).
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
   - Si el interés no está claro, hacé una pregunta breve; si ya está claro,
     proponé opciones sin demorar la respuesta para completar un cuestionario.
   - No inventes datos que no estén ni en el input del usuario ni en el JSON.

7. Lenguaje:
   - Siempre contestá en español.
   - Podés usar "vos" o "tu", pero mantené coherencia dentro de la conversación.

Recordatorio final:
- Tu valor principal está en unir el perfil del usuario con el contenido de "course_catalog".
- Siempre explica el POR QUÉ de cada recomendación, no solo el nombre del curso.`;

export class AssistantService {
  private client: Anthropic | undefined;

  async chat(
    userMessage: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<{ response: string; recommendedCourses: AssistantCourse[]; catalogStale: boolean }> {
    try {
      // Get course catalog
      const catalog = await getAssistantCatalog();
      const courses: AssistantCourse[] = catalog.courses.map((course) => toAssistantCourse(course, config.cors.siteUrl));
      const catalogContext = JSON.stringify(
        { course_catalog: courses },
        null,
        2
      );

      // Build conversation messages
      const firstUser = conversationHistory.findIndex((msg) => msg.role === "user");
      const messages: Anthropic.MessageParam[] = [
        ...(firstUser < 0 ? [] : conversationHistory.slice(firstUser)).map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        {
          role: "user",
          content: `${catalogContext}\n\nUsuario: ${userMessage}`,
        },
      ];

      // Call Claude API
      if (!this.client) {
        if (!config.anthropic.apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
        this.client = new Anthropic({ apiKey: config.anthropic.apiKey });
      }
      let assistantResponse = "";
      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await this.client.messages.create({
          model: config.anthropic.model,
          max_tokens: config.anthropic.maxTokens,
          system: attempt === 0 ? SYSTEM_PROMPT : `${SYSTEM_PROMPT}\n\nIMPORTANTE: Tu respuesta anterior excedió el límite. Respondé con un máximo de 2 preguntas y priorizá recomendaciones concretas.`,
          messages,
        });
        assistantResponse = response.content
          .filter((block) => block.type === "text")
          .map((block) => block.text)
          .join("\n").trim();
        if (!assistantResponse) throw new Error("AI provider returned an empty response");
        const text = assistantResponse.replace(/https?:\/\/\S+/gi, "");
        const opening = (text.match(/¿/g) || []).length;
        const closing = (text.match(/\?/g) || []).length;
        if (Math.max(opening, closing) <= 2) break;
        if (attempt === 1) throw new Error("AI provider exceeded the question limit");
        console.warn("El asistente excedió el límite de preguntas; se intentará nuevamente.");
      }

      // Extract recommended course IDs from the response (simple heuristic)
      const recommendedCourses = this.extractRecommendedCourses(
        assistantResponse,
        courses
      );

      return {
        response: assistantResponse,
        recommendedCourses,
        catalogStale: catalog.stale,
      };
    } catch (error: any) {
      if (error instanceof CatalogUnavailableError) throw error;
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
    allCourses: AssistantCourse[]
  ): AssistantCourse[] {
    const recommended: AssistantCourse[] = [];

    // Look for course names in the response
    for (const course of allCourses) {
      if (response.includes(course.name)) {
        recommended.push(course);
      }
    }

    return recommended.slice(0, 3); // Max 3 recommendations
  }

  async generateWelcomeMessage(): Promise<string> {
    return `¡Hola! 👋 Soy el asistente de la Escuela de Enfermería.

¿Qué te gustaría estudiar y qué experiencia tenés en el área? Con eso puedo sugerirte cursos o carreras disponibles.`;
  }
}

export default AssistantService;
