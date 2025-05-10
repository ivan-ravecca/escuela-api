import { OAuth2Client } from "google-auth-library";

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
