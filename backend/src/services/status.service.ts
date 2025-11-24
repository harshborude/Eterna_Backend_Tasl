import IORedis from "ioredis";
import { env } from "../config/env";
import { OrderModel } from "../models/order.model";
import { OrderStatus } from "../types";

// Separate Redis connection for PubSub (BullMQ cannot reuse this one)
const redisPub = new IORedis({
  host: env.redisHost,
  port: env.redisPort,
});

export const StatusService = {
  async emit(
    orderId: string, 
    status: OrderStatus, 
    message: string, 
    extraData: any = {}
  ) {
    // 1. Prepare the payload
    const payload = {
      orderId,
      status,
      message, // Single string for frontend
      ...extraData
    };

    // 2. Publish to Redis (for WebSocket)
    // Channel: updates:<orderId>
    await redisPub.publish(`updates:${orderId}`, JSON.stringify(payload));

    // 3. Persist to Database
    // CRITICAL FIX: We wrap 'message' in an array [message] 
    // This satisfies the postgres query: logs = array_cat(logs, $2::text[])
    await OrderModel.updateOrder(orderId, {
      status,
      logs: [message], 
      txHash: extraData.txHash,
      executionPrice: extraData.executionPrice,
      chosenDex: extraData.chosenDex
    });
    
    console.log(`[${status.toUpperCase()}] Order ${orderId}: ${message}`);
  }
};