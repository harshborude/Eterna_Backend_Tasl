import { buildServer } from "./server";
import { env } from "./config/env";

const app = buildServer();

app.listen({ port: env.port, host: "0.0.0.0" })
  .then(() => {
    console.log(`🚀 Server running on port ${env.port}`);
  })
  .catch((err) => {
    console.error("❌ Failed to start server", err);
    process.exit(1);
  });
