import { orderQueue } from "../src/queue/order.queue";

describe("Order Queue", () => {
  it("should add job to queue", async () => {
    const job = await orderQueue.add("execute", {
      orderId: "queue-test",
      userId: "u1",
      inputToken: "SOL",
      outputToken: "USDC",
      amount: 1
    });

    expect(job.id).toBeDefined();
  });
});
