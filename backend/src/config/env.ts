import dotenv from "dotenv";

dotenv.config();

export const env = {
  pgUser: process.env.PG_USER!,
  pgPassword: process.env.PG_PASSWORD!,
  pgDatabase: process.env.PG_DATABASE!,
  pgHost: process.env.PG_HOST!,
  pgPort: Number(process.env.PG_PORT || 5432),
  
  // Postgres SSL config (from previous step)
  pgSsl: process.env.PG_SSL === "true", 
  pgCaCert: process.env.PG_CA_CERT,

  // Update Redis config to support URL
  redisUrl: process.env.REDIS_URL, // NEW: Prioritize this
  redisHost: process.env.REDIS_HOST || "localhost",
  redisPort: Number(process.env.REDIS_PORT || 6379),

  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || "development",
};

console.log("Loaded DB:", env.pgDatabase);