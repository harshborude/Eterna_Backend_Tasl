import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env";

// UPDATED: Use URL if available
const connection = env.redisUrl 
  ? new IORedis(env.redisUrl, { maxRetriesPerRequest: null })
  : new IORedis({
      host: env.redisHost,
      port: env.redisPort,
      maxRetriesPerRequest: null, 
    });

export const orderQueue = new Queue("order-execution", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: true,
    removeOnFail: 500
  }
});