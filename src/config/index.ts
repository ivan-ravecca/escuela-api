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
  sendGrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    emailTo: process.env.EMAIL_TO,
    emailFrom: process.env.EMAIL_FROM,
  },
  crypto: {
    hashSecret: process.env.HASH_SECRET,
  },
};

export default config;
