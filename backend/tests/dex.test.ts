import { MockDexRouter } from "../src/services/dex.service";

describe("DEX Router", () => {
  const dex = new MockDexRouter();

  it("should return Raydium quote", async () => {
    const q = await dex.getRaydiumQuote(10);
    expect(q.venue).toBe("Raydium");
    expect(q.price).toBeGreaterThan(0);
  });

  it("should return Meteora quote", async () => {
    const q = await dex.getMeteoraQuote(10);
    expect(q.venue).toBe("Meteora");
    expect(q.price).toBeGreaterThan(0);
  });

  it("should execute swap or throw slippage error", async () => {
    try {
      const r = await dex.executeSwap("Raydium");
      expect(r.txHash).toBeDefined();
    } catch (err: any) {
      expect(err.message).toBe("Slippage tolerance exceeded");
    }
  });
});
