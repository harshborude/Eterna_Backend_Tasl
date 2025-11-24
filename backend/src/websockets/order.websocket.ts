import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { SocketStream } from "@fastify/websocket";
import IORedis from "ioredis";
import { env } from "../config/env";

export async function registerOrderWebsocket(app: FastifyInstance, opts: FastifyPluginOptions) {

  const subscriber = new IORedis({
    host: env.redisHost,
    port: env.redisPort,
  });

  app.get(
    "/ws/orders/:orderId",
    { websocket: true },
    (connection: SocketStream, req) => {

      const orderId = (req.params as any).orderId;
      const channel = `updates:${orderId}`;

      console.log(`📡 WebSocket subscribed to ${channel}`);

      subscriber.subscribe(channel);

      const handler = (chan: string, message: string) => {
        if (chan === channel) {
          connection.socket.send(message);
        }
      };

      subscriber.on("message", handler);

      connection.socket.on("close", () => {
        subscriber.removeListener("message", handler);
        subscriber.unsubscribe(channel);
      });
    }
  );
}
