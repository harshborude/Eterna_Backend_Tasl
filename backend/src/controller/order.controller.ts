import { FastifyRequest, FastifyReply } from "fastify";

export const OrderController = {
  async createOrder(req: FastifyRequest, reply: FastifyReply) {
    return reply.send({ message: "Order create endpoint reached" });
  },

  async orderWebsocket(connection: any, req: any) {
    connection.socket.send("WS connected (placeholder)");
  }
};
