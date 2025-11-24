import { DexQuote } from "../types";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class MockDexRouter {
  private basePrice = 150; 

  async getRaydiumQuote(amount: number): Promise<DexQuote> {
    await sleep(200); 
    return {
      venue: "Raydium",
      price: this.basePrice * (0.98 + Math.random() * 0.04), 
      fee: 0.003
    };
  }

  async getMeteoraQuote(amount: number): Promise<DexQuote> {
    await sleep(200);
    return {
      venue: "Meteora",
      price: this.basePrice * (0.97 + Math.random() * 0.05),
      fee: 0.002
    };
  }

  async executeSwap(venue: string): Promise<{ txHash: string; executedPrice: number }> {
    await sleep(2000 + Math.random() * 1000);

    // 5% chance of failure (reduced from 10% for easier testing)
    if (Math.random() < 0.05) {
      throw new Error("Slippage tolerance exceeded");
    }

    return {
      txHash: `tx_${Math.random().toString(36).substring(2, 10)}_mock`,
      executedPrice: Number((this.basePrice * (0.97 + Math.random() * 0.05)).toFixed(4))
    };
  }
}