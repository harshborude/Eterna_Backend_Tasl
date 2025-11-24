import { orderWorker } from "../src/queue/order.worker";

describe("Worker", () => {
  it("should be defined", () => {
    expect(orderWorker).toBeDefined();
  });
});
