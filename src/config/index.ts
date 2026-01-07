import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  // Server
  PORT: z.string().default("5173"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // JWT
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRATION: z.string().default("7d"),

  // Google
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  ALLOWED_DOMAIN: z.string().min(1, "ALLOWED_DOMAIN is required"),

  // CORS
  SITE_URL: z.string().pipe(z.url({ message: "SITE_URL must be a valid URL" })),

  // Resend
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  EMAIL_TO: z.string().pipe(z.email({ message: "EMAIL_TO must be a valid email" })),
  EMAIL_FROM: z.string().min(1, "EMAIL_FROM is required"),

  // Crypto
  HASH_SECRET: z.string().min(1, "HASH_SECRET is required"),
  CSRF_SECRET: z.string().default("change-this-csrf-secret-in-production"),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().optional().default(""),
  ANTHROPIC_MODEL: z.string().default("claude-3-5-haiku-20241022"),
  ANTHROPIC_MAX_TOKENS: z.string().transform(Number).default(2048),

  // Database
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.string().transform(Number).default(3306),
  DB_USER: z.string().default("escuelaapi"),
  DB_PASSWORD: z.string().default(""),
  DB_NAME: z.string().default("escuela"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  parsed.error.issues.forEach((issue) => {
    console.error(`   ${issue.path.join(".")}: ${issue.message}`);
  });
  process.exit(1);
}

const env = parsed.data;

const config = {
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiration: env.JWT_EXPIRATION,
  },
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    allowedDomain: env.ALLOWED_DOMAIN,
  },
  cors: {
    siteUrl: env.SITE_URL,
  },
  resend: {
    apiKey: env.RESEND_API_KEY,
    emailTo: env.EMAIL_TO,
    emailFrom: env.EMAIL_FROM,
  },
  crypto: {
    hashSecret: env.HASH_SECRET,
    csrfSecret: env.CSRF_SECRET,
  },
  anthropic: {
    apiKey: env.ANTHROPIC_API_KEY,
    model: env.ANTHROPIC_MODEL,
    maxTokens: env.ANTHROPIC_MAX_TOKENS,
  },
  database: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    name: env.DB_NAME,
  },
};

export default config;
