import { FastifyInstance } from "fastify";
import { OrderController } from "../controller/order.controller";

export async function registerOrderRoutes(app: FastifyInstance) {

  // POST /api/orders/execute
  app.post("/execute", OrderController.createOrder);

  // GET /api/orders/ws/:orderId  (WebSocket will be added later)
  // app.get("/ws/:orderId", { websocket: true }, OrderController.orderWebsocket);


}
