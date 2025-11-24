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
      VALUES ($1, $2, $3, $4, $5, 'pending', '{}')
      RETURNING *;
    `;

    const values = [
      data.orderId,
      data.userId,
      data.inputToken,
      data.outputToken,
      data.amount,
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
    // FIX 1: The SQL query explicitly casts $2 to text[] ($2::text[])
    // This tells Postgres "Expect an array of text here"
    const query = `
      UPDATE orders
      SET 
        status = COALESCE($1, status),
        logs = array_cat(logs, $2::text[]),
        tx_hash = COALESCE($3, tx_hash),
        execution_price = COALESCE($4, execution_price),
        updated_at = NOW()
      WHERE order_id = $5
      RETURNING *;
    `;

    // FIX 2: We pass the raw JavaScript Array (updates.logs).
    // We do NOT format it as a string like "{...}".
    const values = [
      updates.status || null,
      updates.logs || null, // Pass the array directly: ['message']
      updates.txHash || null,
      updates.executionPrice || null,
      orderId
    ];

    // Debugging: You should see [ ..., ['Fetching...'], ... ] in logs now
    // NOT [ ..., '{"Fetching..."}', ... ]
    // console.log("DEBUG VALUES:", values); 

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