import { PDFDocument, TextAlignment } from "pdf-lib";
import fs from "fs";
import path from "path";
import { CertificateData } from "../types/index";

/**
 * Fill a PDF template with data
 * @param templatePath Path to the PDF template file
 * @param data Data to fill into the form fields
 * @returns Path to the generated PDF file
 */
async function fillPDFTemplate(
  templatePath: string,
  data: CertificateData,
): Promise<Buffer> {
  // Cargar el PDF template
  const templatePdfBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templatePdfBytes);

  // Obtener formulario del PDF
  const form = pdfDoc.getForm();

  // Obtener todos los campos del formulario
  const fields = form.getFields();

  // Mostrar nombres de campos disponibles (útil para depuración)
  // console.log("Campos disponibles:");
  // fields.forEach((field) => {
  //   console.log(field.getName());
  // });

  try {
    // Ejemplo de llenado de campos específicos
    const studentName = form.getTextField("studentName");
    if (studentName && data.studentName) {
      studentName.setText(data.studentName);
      studentName.setAlignment(TextAlignment.Center);
      studentName.enableReadOnly();
    }

    const courseName = form.getTextField("courseName");
    if (courseName && data.courseName) {
      courseName.setText(data.courseName);
      courseName.setAlignment(TextAlignment.Center);
      courseName.enableReadOnly();
    }

    const courseDate = form.getTextField("courseDate");
    if (courseDate && data.courseDate) {
      courseDate.setText(data.courseDate);
      courseDate.setAlignment(TextAlignment.Center);
      courseDate.enableReadOnly();
    }

    if (data.qrImageBase64) {
      // Remove the data URL prefix if present
      const base64Data = data.qrImageBase64.replace(
        /^data:image\/(png|jpg|jpeg);base64,/,
        "",
      );

      // Convert base64 to Uint8Array
      const qrImageBytes = Buffer.from(base64Data, "base64");

      // Embed the image in the PDF
      const qrImage = await pdfDoc.embedPng(qrImageBytes);

      // Get the first page
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      // Get page dimensions
      const { width, height } = firstPage.getSize();

      // Define QR code size and position (adjust as needed)
      const qrSize = 100;
      //const qrX = width - qrSize - 50;
      const qrX = 380;
      const qrY = 20;

      // Draw the QR code on the page
      firstPage.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrImage.width / 2,
        height: qrImage.height / 2,
      });
    }
    pdfDoc.setAuthor("Escuela de Enfermería Arte y Ciencia");
    pdfDoc.setTitle(`Certificado de Curso ${data.courseName}`);
    pdfDoc.setSubject(`Certificado de Curso ${data.courseName}`);
    pdfDoc.setKeywords([
      "certificado",
      "curso",
      "escuela de enfermería arte y ciencia",
    ]);
    pdfDoc.setProducer("Escuela de Enfermería Arte y Ciencia");
    pdfDoc.setCreator("Escuela de Enfermería Arte y Ciencia");
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());
    pdfDoc.setLanguage("es-ES");

    // Flatten the form (makes form fields non-editable and part of the document content)
    form.flatten();

    // Guardar PDF
    const pdfBytes = await pdfDoc.save();

    // // Guardar el PDF generado en el sistema de archivos
    // const fileName = `certificado-${data.studentName || "sin-nombre"}.pdf`;
    // const outputPath = path.join(process.cwd(), fileName);
    // fs.writeFileSync(outputPath, pdfBytes);

    // return outputPath;

    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error("Error llenando campos:", error);
    throw error;
  }
}

export { fillPDFTemplate };
