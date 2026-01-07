import { Router, Request, Response } from "express";
import { EmailMessage } from "../types";
import config from "../config";
import { Resend } from "resend";
import { validate } from "../middleware/validateMiddleware";
import {
  contactEmailSchema,
  inquireEmailSchema,
  ContactEmailInput,
  InquireEmailInput,
} from "../schemas";

const resend = new Resend(config.resend.apiKey);
const EMAIL_TO = config.resend.emailTo || "";
const EMAIL_FROM = config.resend.emailFrom || "";

const router = Router();

router.post(
  "/send",
  validate(contactEmailSchema),
  async (req: Request, res: Response) => {
    const { name, email, message } = req.body as ContactEmailInput;

    const msg = {
      to: EMAIL_TO,
      from: EMAIL_FROM,
      subject: `Contacto desde la web - ${name}`,
      text: `El siguiente es un mensaje generado desde la web:
          Nombre: ${name}
          Email: ${email}
          Mensaje: ${message}`,
      html: `El siguiente es un mensaje generado desde la web:<br />
         <ul><li><strong>Nombre:</strong> ${name}</li>
         <li><strong>Email:</strong> ${email}</li>
         <li><strong>Mensaje:</strong> ${message}</li></ul>`,
    };
    resend.emails
      .send(msg as EmailMessage)
      .then((): void => {
        res.status(202).send();
      })
      .catch((error: Error): void => {
        res.status(500).send("Error sending email: " + error.message);
      });
  },
);

router.post(
  "/inquire",
  validate(inquireEmailSchema),
  async (req: Request, res: Response) => {
    const { name, email, phone, course, ci, year, inquire } =
      req.body as InquireEmailInput;

    const graduation = year ? `Año de graduación: ${year}` : "";
    const msg = {
      to: EMAIL_TO,
      from: EMAIL_FROM,
      subject: `Bedelías: ${inquire}`,
      text: `La siguiente es una solicitud desde la web para el trámite de ${inquire}:
          Nombre: ${name}
          Email: ${email}
          Teléfono: ${phone}
          Curso: ${course}
          Documento: ${ci}
          ${graduation}
          `,
      html: `La siguiente es una solicitud desde la web para el trámite de <strong>${inquire}</strong>:<br />
         <ul><li><strong>Nombre:</strong> ${name}</li>
         <li><strong>Email:</strong> ${email}</li>
         <li><strong>Teléfono:</strong> ${phone}</li>
         <li><strong>Curso:</strong> ${course}</li>
         <li><strong>Documento:</strong> ${ci}</li>
         <li><strong>${graduation}</strong></li></ul>`,
    };
    resend.emails
      .send(msg as EmailMessage)
      .then((): void => {
        res.status(202).send();
      })
      .catch((error: Error): void => {
        res.status(500).send("Error sending email: " + error.message);
      });
  },
);

export default router;
