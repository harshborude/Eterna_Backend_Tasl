import { v4 as uuidv4 } from "uuid";
import { OrderModel } from "../models/order.model";
import { orderQueue } from "../queue/order.queue";

export const OrderService = {
  async createOrder(input: {
    inputToken: string;
    outputToken: string;
    amount: number;
    userId: string;
  }) {
    // Basic validation
    if (
  input.inputToken == null ||
  input.outputToken == null ||
  input.userId == null ||
  input.amount == null
) {
  throw new Error("Missing required fields");
}

// Now validate amount correctly
if (input.amount <= 0) {
  throw new Error("Amount must be greater than zero");
}

    // Generate unique order ID
    const orderId = uuidv4();

    // Save to DB
   const order = await OrderModel.createOrder({
  orderId,
  userId: input.userId,
  inputToken: input.inputToken,
  outputToken: input.outputToken,
  amount: input.amount,
});

// Push job to queue
await orderQueue.add("execute", {
  orderId,
  inputToken: input.inputToken,
  outputToken: input.outputToken,
  amount: input.amount,
  userId: input.userId
});

return order;

  }
};
