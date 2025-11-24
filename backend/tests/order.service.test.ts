import { OrderService } from "../src/services/order.service";

describe("Order Service", () => {
  it("should reject missing fields", async () => {
    await expect(
      OrderService.createOrder({
        inputToken: "SOL",
        outputToken: "USDC",
        amount: 1,
        userId: ""
      })
    ).rejects.toThrow("Missing required fields");
  });
});
