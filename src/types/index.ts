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

// Interface matching Resend's CreateEmailOptions type
export interface EmailMessage {
  to: string | string[];
  from: string;
  subject: string;
  text: string; // Make text required as Resend needs it
  html?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface DriveFileResponse {
  stream: Readable;
  metadata: {
    name: string;
    mimeType: string;
  };
}

export interface DriveUploadResult {
  fileId: string;
  name?: string;
  webViewLink: string;
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

// Re-export ProgramOption from centralized config
export type { ProgramOption } from "../config/programOptions";
