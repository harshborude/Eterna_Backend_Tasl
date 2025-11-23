import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { registerOrderRoutes } from "./routes/order.routes";

export const buildServer = () => {
  const app = Fastify({ logger: true });

  // WebSocket support
  app.register(websocket);

  // Register all /api/orders routes
  app.register(registerOrderRoutes, { prefix: "/api/orders" });

  return app;
};
