import { pg } from "../db/postgres";
import { OrderStatus } from "../types/index";

export interface CreateOrderInput {
  orderId: string;
  userId: string;
  inputToken: string;
  outputToken: string;
  amount: number;
}

export const OrderModel = {
  async createOrder(data: CreateOrderInput) {
    const query = `
      INSERT INTO orders (
        order_id, user_id, input_token, output_token, amount, status, logs
      )
      VALUES ($1, $2, $3, $4, $5, 'pending', $6)
      RETURNING *;
    `;

    const values = [
      data.orderId,
      data.userId,
      data.inputToken,
      data.outputToken,
      data.amount,
      []
    ];

    const result = await pg.query(query, values);
    return result.rows[0];
  },

  async updateOrder(orderId: string, updates: {
    status?: OrderStatus;
    logs?: string[];
    txHash?: string;
    executionPrice?: number;
    chosenDex?: string;
  }) {

    const query = `
      UPDATE orders
      SET 
        status = COALESCE($1, status),
        logs = CASE 
          WHEN $2 IS NOT NULL THEN array_cat(logs, $2)
          ELSE logs
        END,
        tx_hash = COALESCE($3, tx_hash),
        execution_price = COALESCE($4, execution_price),
        updated_at = NOW()
      WHERE order_id = $5
      RETURNING *;
    `;

    const values = [
      updates.status || null,
      updates.logs || null,
      updates.txHash || null,
      updates.executionPrice || null,
      orderId
    ];

    const result = await pg.query(query, values);
    return result.rows[0];
  },

  async getOrderById(orderId: string) {
    const result = await pg.query(
      `SELECT * FROM orders WHERE order_id = $1`,
      [orderId]
    );
    return result.rows[0];
  },
};
