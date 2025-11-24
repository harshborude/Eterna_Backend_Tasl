import { Pool, PoolConfig } from "pg";
import { env } from "../config/env";

const config: PoolConfig = {
  user: env.pgUser,
  password: env.pgPassword,
  database: env.pgDatabase,
  host: env.pgHost,
  port: env.pgPort,
};

// Add SSL configuration for Aiven
if (env.pgSsl) {
  config.ssl = {
    rejectUnauthorized: false, // Set to true if you provide the CA Cert below
    ca: env.pgCaCert ? env.pgCaCert : undefined,
  };
}

export const pg = new Pool(config);

pg.on("connect", () => {
  console.log("📦 Connected to PostgreSQL (Hosted)");
});

pg.on("error", (err: Error) => {
  console.error("❌ Postgres error:", err);
});