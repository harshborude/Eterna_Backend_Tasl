import { MockDexRouter } from "./services/dex.service";

async function testDEX() {
  const dex = new MockDexRouter();

  console.log("Getting Raydium quote...");
  const raydium = await dex.getRaydiumQuote(1);
  console.log("Raydium Quote:", raydium);

  console.log("Getting Meteora quote...");
  const meteora = await dex.getMeteoraQuote(1);
  console.log("Meteora Quote:", meteora);

  console.log("Executing Swap...");
  try {
    const result = await dex.executeSwap("Raydium");
    console.log("Swap Result:", result);
  } catch (err: any) {
    console.log("Swap FAILED:", err.message);
  }
}

testDEX();
