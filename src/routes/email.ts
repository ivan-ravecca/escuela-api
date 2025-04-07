import { Router, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const EMAIL_TO = process.env.EMAIL_TO;
const EMAIL_FROM = process.env.EMAIL_FROM;

const router = Router();

interface EmailMessage {
  to: string | undefined;
  from: string | undefined;
  subject: string;
  text: string;
  html: string;
}

router.post("/send", async (req: Request, res: Response) => {
  res.status(202).send();
});

// router.post("/send", async (req: Request, res: Response) => {
//   const { name, email, message } = req.body;

//   const msg = {
//     to: EMAIL_TO,
//     from: EMAIL_FROM,
//     subject: `Contacto desde la web - ${name}`,
//     text: `El siguiente es un mensaje generado desde la web:
//           Nombre: ${name}
//           Email: ${email}
//           Mensaje: ${message}`,
//     html: `El siguiente es un mensaje generado desde la web:<br />
//          <ul><li><strong>Nombre:</strong> ${name}</li>
//          <li><strong>Email:</strong> ${email}</li>
//          <li><strong>Mensaje:</strong> ${message}</li></ul>`,
//   };
//   // const origin = req.headers.origin;
//   // res.header("Access-Control-Allow-Origin", origin);
//   // res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
//   // res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   // res.header("Access-Control-Allow-Credentials", "true");
//   sgMail
//     .send(msg as EmailMessage)
//     .then((): void => {
//       res.status(202).send();
//     })
//     .catch((error: Error): void => {
//       res.status(500).send("Error sending email: " + error.message);
//     });
// });

// router.post("/inquire", async (req: Request, res: Response) => {
//   const { name, email, phone, course, ci, year, inquire } = req.body;

//   if (!name || !email || !phone || !course || !ci || !inquire) {
//     res.status(400).send({
//       error: "Missing required fields",
//       missingFields: {
//         name: !name ? "name is required" : undefined,
//         email: !email ? "email is required" : undefined,
//         phone: !phone ? "phone is required" : undefined,
//         course: !course ? "course is required" : undefined,
//         ci: !ci ? "ci is required" : undefined,
//         inquire: !inquire ? "inquire is required" : undefined,
//       },
//     });
//   } else {
//     const graduation = year ? `Año de graduación: ${year}` : "";
//     const msg = {
//       to: EMAIL_TO,
//       from: EMAIL_FROM,
//       subject: `Bedelías: ${inquire}`,
//       text: `La siguiente es una solicitud desde la web para el trámite de ${inquire}:
//           Nombre: ${name}
//           Email: ${email}
//           Teléfono: ${phone}
//           Curso: ${course}
//           Documento: ${ci}
//           ${graduation}
//           `,
//       html: `La siguiente es una solicitud desde la web para el trámite de <strong>${inquire}</strong>:<br />
//          <ul><li><strong>Nombre:</strong> ${name}</li>
//          <li><strong>Email:</strong> ${email}</li>
//          <li><strong>Teléfono:</strong> ${phone}</li>
//          <li><strong>Curso:</strong> ${course}</li>
//          <li><strong>Documento:</strong> ${ci}</li>
//          <li><strong>${graduation}</strong></li></ul>`,
//     };
//     sgMail
//       .send(msg as EmailMessage)
//       .then((): void => {
//         res.status(202).send();
//       })
//       .catch((error: Error): void => {
//         res.status(500).send("Error sending email: " + error.message);
//       });
//   }
// });

// router.post("/test", async (req: Request, res: Response) => {
//   const { name, email, message } = req.body;
//   res.status(202).send(`${name} - ${email} - ${message}`);
// });

export default router;
