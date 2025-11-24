// import request from 'supertest';
// import { buildServer } from '../src/server';
// import { pg } from '../src/db/postgres';
// import { orderQueue } from '../src/queue/order.queue';

// // --- MOCKS ---

// // 1. Mock IORedis (CRITICAL FIX)
// // This prevents server.ts and status.service.ts from trying to connect to real Redis
// jest.mock('ioredis', () => {
//   return jest.fn().mockImplementation(() => ({
//     subscribe: jest.fn(),
//     publish: jest.fn(),
//     on: jest.fn(),
//     unsubscribe: jest.fn(),
//     removeListener: jest.fn(),
//     connect: jest.fn(),
//     status: 'ready',
//   }));
// });

// // 2. Mock Postgres
// jest.mock('../src/db/postgres', () => ({
//   pg: {
//     query: jest.fn(),
//   },
// }));

// // 3. Mock BullMQ
// jest.mock('../src/queue/order.queue', () => ({
//   orderQueue: {
//     add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
//   },
// }));

// describe('API Integration Tests', () => {
//   let app: any;

//   beforeAll(async () => {
//     app = buildServer();
//     // CRITICAL FIX: Wait for Fastify to load plugins (websocket, etc.)
//     await app.ready(); 
//   });

//   afterAll(async () => {
//     await app.close();
//   });

//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   // TEST 5: POST /execute Success
//   test('POST /api/orders/execute should return 202 Accepted', async () => {
//     (pg.query as jest.Mock).mockResolvedValue({ rows: [{}] });

//     const response = await request(app.server)
//       .post('/api/orders/execute')
//       .send({
//         inputToken: 'SOL',
//         outputToken: 'USDC',
//         amount: 10,
//         userId: 'test-user',
//       });

//     expect(response.status).toBe(202);
//     expect(response.body).toHaveProperty('orderId');
//     expect(response.body.status).toBe('pending');
//   });

//   // TEST 6: Queue Behavior
//   test('should add job to BullMQ when order is received', async () => {
//     (pg.query as jest.Mock).mockResolvedValue({ rows: [{}] });

//     await request(app.server)
//       .post('/api/orders/execute')
//       .send({
//         inputToken: 'SOL',
//         outputToken: 'USDC',
//         amount: 5,
//         userId: 'test-user',
//       });

//     expect(orderQueue.add).toHaveBeenCalledTimes(1);
//     expect(orderQueue.add).toHaveBeenCalledWith(
//       'trade', 
//       expect.objectContaining({ 
//         amount: 5, 
//         userId: 'test-user' 
//       })
//     );
//   });

//   // TEST 7: Database Persistence
//   test('should save initial order state to Postgres', async () => {
//     (pg.query as jest.Mock).mockResolvedValue({ rows: [{}] });

//     await request(app.server)
//       .post('/api/orders/execute')
//       .send({
//         inputToken: 'SOL',
//         outputToken: 'USDC',
//         amount: 5,
//         userId: 'test-user',
//       });

//     expect(pg.query).toHaveBeenCalledWith(
//       expect.stringContaining('INSERT INTO orders'),
//       expect.any(Array)
//     );
//   });

//   // TEST 8: Input Handling
//   test('should handle requests with basic body', async () => {
//     const response = await request(app.server)
//       .post('/api/orders/execute')
//       .send({});
      
//     expect(response.status).not.toBe(404);
//   });

//   // TEST 9: WebSocket Upgrade Header Check
//   test('GET /api/orders/ws/:orderId should allow websocket upgrade', async () => {
//     await request(app.server)
//       .get('/api/orders/ws/test-order-id')
//       .set('Connection', 'Upgrade')
//       .set('Upgrade', 'websocket')
//       .set('Sec-WebSocket-Key', 'dGhlIHNhbXBsZSBub25jZQ==')
//       .set('Sec-WebSocket-Version', '13')
//       .expect(101); 
//   });

//   // TEST 10: Database Error Handling
//   test('should return error if database fails', async () => {
//     (pg.query as jest.Mock).mockRejectedValue(new Error('DB Connection Failed'));

//     const response = await request(app.server)
//       .post('/api/orders/execute')
//       .send({
//         inputToken: 'SOL',
//         outputToken: 'USDC',
//         amount: 10,
//         userId: 'test-user',
//       });

//     expect(response.status).toBe(500); 
//   });
// });