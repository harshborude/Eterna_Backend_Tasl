import IORedis from "ioredis";
import { env } from "../config/env";
import { OrderModel } from "../models/order.model";
import { OrderStatus } from "../types";

const pub = new IORedis({
  host: env.redisHost,
  port: env.redisPort,
});

export const StatusService = {
  /**
   * Emit status update to WebSocket clients + update DB
   */
  async emit(orderId: string, status: OrderStatus, message: string, extra?: {
    txHash?: string;
    executionPrice?: number;
    chosenDex?: string;
  }) {
    const payload = {
      orderId,
      status,
      message,
      ...extra
    };

    // 1. Publish to Redis Pub/Sub (WS will pick this up)
    await pub.publish(`updates:${orderId}`, JSON.stringify(payload));

    // 2. Update order in database
    await OrderModel.updateOrder(orderId, {
      status,
      logs: [message],
      txHash: extra?.txHash,
      executionPrice: extra?.executionPrice,
      chosenDex: extra?.chosenDex,
    });

    console.log(`[${orderId}] ${status.toUpperCase()}: ${message}`);
  }
};
