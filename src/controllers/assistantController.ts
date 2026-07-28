import { Request, Response } from "express";
import { AssistantService } from "../services/assistantService";
import { ChatInput, LeadCaptureInput } from "../schemas";
import { Resend } from "resend";
import config from "../config";
import sanitizeHtml from "sanitize-html";

interface AssistantServiceDeps {
  chat: AssistantService["chat"];
  generateWelcomeMessage: AssistantService["generateWelcomeMessage"];
}

interface ResendDeps {
  emails: {
    send: (...args: any[]) => Promise<any>;
  };
}

const defaultAssistantService = new AssistantService();
const defaultResendClient = new Resend(config.resend.apiKey);

let assistantService: AssistantServiceDeps = defaultAssistantService;
let resendClient: ResendDeps = defaultResendClient;

export const setAssistantControllerDependencies = (dependencies: {
  assistantService?: AssistantServiceDeps;
  resendClient?: ResendDeps;
}): void => {
  if (dependencies.assistantService) {
    assistantService = dependencies.assistantService;
  }

  if (dependencies.resendClient) {
    resendClient = dependencies.resendClient;
  }
};

export const resetAssistantControllerDependencies = (): void => {
  assistantService = defaultAssistantService;
  resendClient = defaultResendClient;
};

export class AssistantController {
  static async chat(req: Request, res: Response): Promise<void> {
    try {
      // Validation is handled by middleware, data is already validated and typed
      const { message, conversation_history } = req.body as ChatInput;

      // Additional business validation: total conversation size (max 40KB)
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
      // Validation is handled by middleware, data is already validated and typed
      const { name, phone, email, course_id, course_name } =
        req.body as LeadCaptureInput;

      // Validate phone format (basic validation)
      const phoneRegex = /^[0-9\s\-\+\(\)]+$/;
      if (!phoneRegex.test(phone)) {
        res.status(400).json({ error: "Formato de número de teléfono inválido" });
        return;
      }

      // Sanitize inputs to prevent XSS in emails
      const sanitizedName = sanitizeHtml(name, {
        allowedTags: [],
        allowedAttributes: {},
      });
      const sanitizedPhone = sanitizeHtml(phone, {
        allowedTags: [],
        allowedAttributes: {},
      });
      const sanitizedEmail = email
        ? sanitizeHtml(email, { allowedTags: [], allowedAttributes: {} })
        : undefined;
      const sanitizedCourseName = sanitizeHtml(course_name, {
        allowedTags: [],
        allowedAttributes: {},
      });

      // Send email notification
      const emailContent = {
        to: config.resend.emailTo || "",
        from: config.resend.emailFrom || "",
        replyTo: sanitizedEmail,
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

      await resendClient.emails.send(emailContent);

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
