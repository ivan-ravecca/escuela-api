import { afterEach, beforeAll, vi } from "vitest";

beforeAll(() => {
  process.env.NODE_ENV = "test";
  process.env.PORT = "5173";
  process.env.JWT_SECRET = "test-jwt-secret";
  process.env.JWT_EXPIRATION = "7d";
  process.env.GOOGLE_CLIENT_ID = "test-google-client";
  process.env.ALLOWED_DOMAIN = "escuelaenfermeria.com.uy";
  process.env.SITE_URL = "https://escuelaenfermeria.com.uy";
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.EMAIL_TO = "admin@escuelaenfermeria.com.uy";
  process.env.EMAIL_FROM = "noreply@escuelaenfermeria.com.uy";
  process.env.HASH_SECRET = "test-hash-secret";
  process.env.CSRF_SECRET = "test-csrf-secret";
  process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
});

afterEach(() => {
  vi.clearAllMocks();
});
