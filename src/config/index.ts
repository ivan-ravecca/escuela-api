import dotenv from "dotenv";

dotenv.config();

const config = {
  server: {
    port: process.env.port,
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
};

export default config;
