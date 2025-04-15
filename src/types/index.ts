import { OAuth2Client } from "google-auth-library";

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface AuthInterface {
  router: any;
  oauth2Client: OAuth2Client;
  getTokens: () => GoogleTokens | null;
}
