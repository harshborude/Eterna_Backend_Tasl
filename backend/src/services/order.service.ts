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
    // Validate fields
    if (!input.inputToken?.trim()) throw new Error("inputToken is required");
    if (!input.outputToken?.trim()) throw new Error("outputToken is required");
    if (!input.userId?.trim()) throw new Error("userId is required");
    if (input.amount == null || input.amount <= 0)
      throw new Error("Amount must be greater than zero");

    // Unique order ID
    const orderId = uuidv4();

    // Create database order
    const order = await OrderModel.createOrder({
      orderId,
      userId: input.userId,
      inputToken: input.inputToken,
      outputToken: input.outputToken,
      amount: input.amount,
    });

    // Add to queue
    await orderQueue.add("execute", {
      orderId,
      inputToken: input.inputToken,
      outputToken: input.outputToken,
      amount: input.amount,
      userId: input.userId,
    });

    return order;
  },
};
