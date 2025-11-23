// Order lifecycle states
export type OrderStatus =
  'pending' |
  'routing' |
  'building' |
  'submitted' |
  'confirmed' |
  'failed';

// Quote from Raydium / Meteora
export interface DexQuote {
  venue: 'Raydium' | 'Meteora';
  price: number;
  fee: number;
}

// Payload used across queue + services
export interface OrderPayload {
  orderId: string;
  userId: string;
  inputToken: string;
  outputToken: string;
  amount: number;
}
