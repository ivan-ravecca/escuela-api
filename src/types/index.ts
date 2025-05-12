import { OAuth2Client } from "google-auth-library";
import { Readable } from "stream";

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

// Generar un código QR a partir de una URL
export interface QRCodeOptions {
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
  type: "png";
  quality: number;
  margin: number;
  color: {
    dark: string;
    light: string;
  };
}

export interface EmailMessage {
  to: string | undefined;
  from: string | undefined;
  subject: string;
  text: string;
  html: string;
}

export interface DriveFileResponse {
  stream: Readable;
  metadata: {
    name: string;
    mimeType: string;
  };
}

/**
 * Data interface for PDF template fields
 */
export interface CertificateData {
  studentName?: string;
  courseName?: string;
  courseDate?: string;
  qrImageBase64?: string;
}
