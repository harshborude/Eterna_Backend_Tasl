import { FastifyReply, FastifyRequest } from "fastify";
import { OrderService } from "../services/order.service";
import {WebSocket} from "ws";

export const OrderController = {
  async createOrder(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = req.body as any;

      const order = await OrderService.createOrder({
        inputToken: body.inputToken,
        outputToken: body.outputToken,
        amount: body.amount,
        userId: body.userId
      });

      return reply.status(202).send({
        orderId: order.order_id,
        status: order.status
      });

    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  },

  //  orderWebsocket(socket: WebSocket, req: FastifyRequest) {
  //   console.log("📡 Client connected:", req.params);

  //   socket.send("WS connection established");

  //   // Keep socket alive (optional)
  //   socket.on("close", () => {
  //     console.log("🔌 WebSocket client disconnected");
  //   });
  // }
};
