import { Pool } from "pg";
import { env } from "../config/env";

export const pg = new Pool({
  user: env.pgUser,
  password: env.pgPassword,
  database: env.pgDatabase,
  host: env.pgHost,
  port: env.pgPort,
});

pg.on("connect", () => {
  console.log("📦 Connected to PostgreSQL");
});

pg.on("error", (err: Error) => {
  console.error("❌ Postgres error:", err);
});
