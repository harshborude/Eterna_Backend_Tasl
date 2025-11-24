import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env";

// FIXED: Added maxRetriesPerRequest: null
const connection = new IORedis({
  host: env.redisHost,
  port: env.redisPort,
  maxRetriesPerRequest: null, 
});

export const orderQueue = new Queue("order-execution", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: true, // Keep DB clean
    removeOnFail: 500       // Keep failed jobs for debugging
  }
});