import { Request, Response } from "express";
import { AssistantService } from "../services/assistantService";
import { ChatRequest, LeadCaptureRequest } from "../types/course";
import { Resend } from "resend";
import config from "../config";
import sanitizeHtml from "sanitize-html";

const assistantService = new AssistantService();
const resend = new Resend(config.resend.apiKey);

export class AssistantController {
  static async chat(req: Request, res: Response): Promise<void> {
    try {
      const { message, conversation_history = [] } = req.body as ChatRequest;

      if (!message || message.trim() === "") {
        res.status(400).json({ error: "Un mensaje es requerido" });
        return;
      }

      // Validate message length (max 2000 characters)
      if (message.length > 2000) {
        res.status(400).json({
          error: "El mensaje es demasiado largo. Máximo 2000 caracteres.",
        });
        return;
      }

      // Validate conversation history length
      if (conversation_history.length > 20) {
        res.status(400).json({
          error: "La conversación es demasiado larga. Por favor, inicia una nueva conversación.",
        });
        return;
      }

      // Validate individual messages in history (max 2000 chars each)
      const hasOversizedMessage = conversation_history.some(
        (msg) => msg.content.length > 2000
      );
      if (hasOversizedMessage) {
        res.status(400).json({
          error: "Uno o más mensajes en el historial son demasiado largos.",
        });
        return;
      }

      // Validate total conversation size (max 40KB)
      const totalSize = conversation_history.reduce(
        (acc, msg) => acc + msg.content.length,
        message.length
      );
      if (totalSize > 40000) {
        res.status(400).json({
          error: "La conversación total es demasiado grande. Por favor, inicia una nueva conversación.",
        });
        return;
      }

      const result = await assistantService.chat(message, conversation_history);

      res.status(200).json({
        response: result.response,
        recommended_courses: result.recommendedCourses,
      });
    } catch (error) {
      console.error("Error in chat controller:", error);
      
      // Handle AI overload error (529)
      if (error instanceof Error && error.message === "AI_OVERLOADED") {
        res.status(503).json({
          error: "Nuestro asistente de IA está experimentando mucha demanda en este momento. Por favor, intentá de nuevo en unos minutos. Gracias por tu paciencia. 🙏",
          code: "AI_OVERLOADED"
        });
        return;
      }
      
      res.status(500).json({
        error: "Error al procesar el mensaje de chat",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  static async welcome(req: Request, res: Response): Promise<void> {
    try {
      const welcomeMessage = await assistantService.generateWelcomeMessage();
      res.status(200).json({ message: welcomeMessage });
    } catch (error) {
      console.error("Error generating welcome message:", error);
      res.status(500).json({ error: "Error al generar el mensaje de bienvenida" });
    }
  }

  static async captureInterest(req: Request, res: Response): Promise<void> {
    try {
      const { name, phone, email, course_id, course_name } =
        req.body as LeadCaptureRequest;

      if (!name || !phone || !course_id || !course_name) {
        res.status(400).json({
          error: "El nombre, teléfono, y datos del curso son obligatorios",
          missing_fields: {
            name: !name ? "El nombre es obligatorio" : undefined,
            phone: !phone ? "El teléfono es obligatorio" : undefined,
            course_id: !course_id ? "El ID del curso es obligatorio" : undefined,
            course_name: !course_name ? "El nombre del curso es obligatorio" : undefined,
          },
        });
        return;
      }

      // Validate field lengths
      if (name.length > 100) {
        res.status(400).json({ error: "El nombre es demasiado largo (máximo 100 caracteres)" });
        return;
      }

      if (phone.length > 20) {
        res.status(400).json({ error: "El teléfono es demasiado largo (máximo 20 caracteres)" });
        return;
      }

      if (email && email.length > 100) {
        res.status(400).json({ error: "El email es demasiado largo (máximo 100 caracteres)" });
        return;
      }

      if (course_name.length > 200) {
        res.status(400).json({ error: "El nombre del curso es demasiado largo" });
        return;
      }

      // Validate phone format (basic validation)
      const phoneRegex = /^[0-9\s\-\+\(\)]+$/;
      if (!phoneRegex.test(phone)) {
        res.status(400).json({ error: "Formato de número de teléfono inválido" });
        return;
      }

      // Sanitize inputs to prevent XSS in emails
      const sanitizedName = sanitizeHtml(name, { allowedTags: [], allowedAttributes: {} });
      const sanitizedPhone = sanitizeHtml(phone, { allowedTags: [], allowedAttributes: {} });
      const sanitizedEmail = email ? sanitizeHtml(email, { allowedTags: [], allowedAttributes: {} }) : undefined;
      const sanitizedCourseName = sanitizeHtml(course_name, { allowedTags: [], allowedAttributes: {} });

      // Send email notification
      const emailContent = {
        to: config.resend.emailTo || "",
        from: config.resend.emailFrom || "",
        subject: `Nuevo interesado - ${sanitizedCourseName} - ${sanitizedName}`,
        text: `Nuevo contacto desde el asistente de IA:
        
Nombre: ${sanitizedName}
Teléfono: ${sanitizedPhone}
Email: ${sanitizedEmail || "No proporcionado"}

Curso de interés:
  - ${sanitizedCourseName} (ID: ${course_id})

Este lead fue generado cuando el usuario hizo click en "Me interesa" desde el asistente de orientación académica.`,
        html: `
<h2>Nuevo contacto desde el asistente de IA</h2>

<ul>
  <li><strong>Nombre:</strong> ${sanitizedName}</li>
  <li><strong>Teléfono:</strong> ${sanitizedPhone}</li>
  <li><strong>Email:</strong> ${sanitizedEmail || "No proporcionado"}</li>
</ul>

<h3>Curso de interés:</h3>
<ul>
  <li><strong>${sanitizedCourseName}</strong> (ID: ${course_id})</li>
</ul>

<p><em>Este lead fue generado cuando el usuario hizo click en "Me interesa" desde el asistente de orientación académica.</em></p>
        `,
      };

      await resend.emails.send(emailContent);

      res.status(200).json({
        message: "¡Gracias por tu interés! Nos pondremos en contacto contigo pronto.",
        success: true,
      });
    } catch (error) {
      console.error("Error capturing interest:", error);
      res.status(500).json({
        error: "Failed to process interest capture",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
