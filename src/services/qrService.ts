import QRCode from "qrcode";
import { Buffer } from "buffer";
import { QRCodeOptions } from "../types";

async function generateQRCode(url: string): Promise<Buffer> {
  try {
    // Opciones para personalizar el código QR
    const options: QRCodeOptions = {
      errorCorrectionLevel: "H", // Alta corrección de errores
      type: "png",
      quality: 0.92,
      margin: 1,
      color: {
        dark: "#000000", // Color de los módulos del QR
        light: "#FFFFFF", // Color de fondo
      },
    };

    // Generar el código QR como un buffer
    const qrBuffer: Buffer = await QRCode.toBuffer(url, options);
    return qrBuffer;
  } catch (error) {
    //console.error("Error al generar el código QR:", error);
    throw error;
  }
}

export { generateQRCode };
