import { Router, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
const sgMail = require("@sendgrid/mail");
import cors from "cors";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const EMAIL_TO = process.env.EMAIL_TO;
const EMAIL_FROM = process.env.EMAIL_FROM;

const router = Router();

const corsOptions = {
  origin: /\.escuelaenfermeria\.com\.uy$/,
  credentials: true,
};

router.use(cors(corsOptions));

router.post("/send", async (req: Request, res: Response) => {
  const { name, email, message } = req.body;

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
  interface EmailMessage {
    to: string | undefined;
    from: string | undefined;
    subject: string;
    text: string;
    html: string;
  }

  sgMail
    .send(msg as EmailMessage)
    .then((): void => {
      res.status(202).send();
    })
    .catch((error: Error): void => {
      res.status(500).send("Error sending email: " + error.message);
    });
});

router.post("/test", async (req: Request, res: Response) => {
  const { name, email, message } = req.body;
  res.status(202).send(`${name} - ${email} - ${message}`);
});

export default router;
