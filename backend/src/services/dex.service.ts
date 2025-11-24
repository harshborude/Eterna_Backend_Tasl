import { DexQuote } from "../types";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class MockDexRouter {
  private basePrice = 150; // mock SOL price for demonstration

  async getRaydiumQuote(amount: number): Promise<DexQuote> {
    await sleep(200); // network latency simulation
    return {
      venue: "Raydium",
      price: this.basePrice * (0.98 + Math.random() * 0.04), // ±2–4%
      fee: 0.003
    };
  }

  async getMeteoraQuote(amount: number): Promise<DexQuote> {
    await sleep(200);
    return {
      venue: "Meteora",
      price: this.basePrice * (0.97 + Math.random() * 0.05), // ±3–5%
      fee: 0.002
    };
  }

  async executeSwap(venue: string): Promise<{ txHash: string; executedPrice: number }> {
    // simulate 2–3 second execution
    await sleep(2000 + Math.random() * 1000);

    // simulate potential slippage error
    if (Math.random() < 0.1) {
      throw new Error("Slippage tolerance exceeded");
    }

    return {
      txHash: `tx_${Math.random().toString(36).substring(2, 10)}_mock`,
      executedPrice: Number((this.basePrice * (0.97 + Math.random() * 0.05)).toFixed(4))
    };
  }
}
