import { OrderModel } from "../src/models/order.model";

describe("Order Model", () => {
  it("should insert order", async () => {
    const order = await OrderModel.createOrder({
      orderId: "test123",
      userId: "user1",
      inputToken: "SOL",
      outputToken: "USDC",
      amount: 1
    });

    expect(order.order_id).toBe("test123");
    expect(order.status).toBe("pending");
  });
});
