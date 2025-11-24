import { Worker } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env";
import { StatusService } from "../services/status.service";
import { MockDexRouter } from "../services/dex.service";
import { OrderPayload } from "../types";

// FIXED: Added maxRetriesPerRequest: null
const connection = new IORedis({
  host: env.redisHost,
  port: env.redisPort,
  maxRetriesPerRequest: null,
});

const dex = new MockDexRouter();

export const orderWorker = new Worker(
  "order-execution",
  async job => {
    const { orderId, amount } = job.data as OrderPayload;

    try {
      // STEP 1 — Routing
      await StatusService.emit(orderId, "routing", "Fetching quotes from Raydium & Meteora...");

      const [raydium, meteora] = await Promise.all([
        dex.getRaydiumQuote(amount),
        dex.getMeteoraQuote(amount)
      ]);

      const bestQuote = raydium.price < meteora.price ? raydium : meteora;

      await StatusService.emit(orderId, "routing", `Best route: ${bestQuote.venue}`, {
        chosenDex: bestQuote.venue
      });

      // STEP 2 — Building Transaction
      await StatusService.emit(orderId, "building", "Building transaction...");
      await new Promise(r => setTimeout(r, 500));

      // STEP 3 — Submitted
      await StatusService.emit(orderId, "submitted", "Transaction submitted to network...");

      // STEP 4 — Simulate transaction execution
      const { txHash, executedPrice } = await dex.executeSwap(bestQuote.venue);

      // STEP 5 — Confirmed
      await StatusService.emit(orderId, "confirmed", "Swap executed successfully", {
        txHash,
        executionPrice: executedPrice
      });

    } catch (err: any) {
      await StatusService.emit(orderId, "failed", err.message || "Unknown error");
      throw err; 
    }
  },
  {
    connection,
    concurrency: 10,
    limiter: {
      max: 100,
      duration: 60000
    }
  }
);

orderWorker.on("completed", job => {
  console.log(`✓ Job ${job.id} completed`);
});

orderWorker.on("failed", (job, err) => {
  console.error(`✗ Job ${job?.id} failed:`, err.message);
});