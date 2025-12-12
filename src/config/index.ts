import dotenv from "dotenv";

dotenv.config();

const config = {
  server: {
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiration: process.env.JWT_EXPIRATION,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    allowedDomain: process.env.ALLOWED_DOMAIN,
  },
  cors: {
    siteUrl: process.env.SITE_URL,
    baseUrl: process.env.BASE_URL,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    emailTo: process.env.EMAIL_TO,
    emailFrom: process.env.EMAIL_FROM,
  },
  crypto: {
    hashSecret: process.env.HASH_SECRET,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022",
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || "2048"),
  },
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "escuelaapi",
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME || "escuela",
  },
};

export default config;
