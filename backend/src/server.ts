import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { registerOrderRoutes } from "./routes/order.routes";
import { registerOrderWebsocket } from "./websockets/order.websocket";

export const buildServer = () => {
  const app = Fastify({ logger: true });

  app.register(websocket);

  // REGISTER WS AS A PLUGIN (critical)
  app.register(registerOrderWebsocket);

  // Register REST API
  app.register(registerOrderRoutes, { prefix: "/api/orders" });

  return app;
};
