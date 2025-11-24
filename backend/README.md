---

# **✅ 📍 SECTION 1 \- Project Overview**

# **Eterna Backend Task \- Order Execution Engine**

This project implements a **full Order Execution Engine** similar to what real crypto trading platforms use.

It includes:

* **Fastify REST API**

* **BullMQ Queue System**

* **Order Execution Worker Engine**

* **Mock DEX Routing Logic (Raydium / Meteora)**

* **Redis Pub/Sub**

* **WebSocket real-time updates**

* **PostgreSQL persistence**

* **Dockerized environment for production**

The system simulates how an automated order execution backend works:

1. A user sends an order (`/execute`)

2. Order is saved to PostgreSQL

3. Order is added to a BullMQ queue

4. The Worker picks it up and:

   * Fetches DEX quotes

   * Chooses best route

   * Builds transaction

   * Submits

   * Simulates execution

5. On each step, status is:

   * Published to Redis channel: `updates:<orderId>`

   * Stored into DB logs

6. WebSocket clients subscribed to `/ws/orders/:orderId`  
    immediately receive updates in real time.

---

### **This backend includes the following components:**

#### **🟦 API Service**

Handles:

* Order creation

* WebSocket subscriptions

* Database connectivity

#### **🟥 PostgreSQL**

Stores:

* Orders

* Status

* Logs

* Final execution data

#### **🟧 BullMQ Queue**

Reliable background job processor.

#### **🟩 Redis**

* Queue backend

* Pub/Sub for real-time WebSocket messages

#### **🟨 Worker Engine**

Executes:

* Price routing

* Transaction build

* Swap simulation

* Error handling

#### **🟪 WebSocket Server**

Pushes live order updates per orderId.

Great \- moving to **SECTION 2: API Documentation**.

This section explains **every API in detail**, including request/response format, internal flow, and expected results.

---

# **✅ 📍 SECTION 2 \- API Documentation**

Your backend exposes **two main API endpoints**:

---

# **\#\#\# 1️⃣ POST `/api/orders/execute`**

This is the main endpoint that **creates an order** and pushes it into the execution engine.

---

## **📌 Purpose**

Start the order lifecycle by:

1. Validating input

2. Creating DB entry

3. Adding job to BullMQ

4. Returning immediately with orderId

The actual work happens asynchronously in the Worker.

---

## **📥 Request Body (JSON)**

{  
  "inputToken": "SOL",  
  "outputToken": "USDC",  
  "amount": 10,  
  "userId": "user123"  
}

### **📌 Field Requirements**

| Field | Type | Required | Description |
| ----- | ----- | ----- | ----- |
| inputToken | string | ✅ | Token being sold |
| outputToken | string | ✅ | Token being bought |
| amount | number | ✅ | Must be \> 0 |
| userId | string | ✅ | User who placed order |

Orders with invalid or missing data are rejected.

---

## **📤 Successful Response**

{  
  "orderId": "bbd55a4d-aeba-4aca-8e31-6653dfb7ccb3",  
  "status": "pending"  
}

### **📌 What happens after calling this API (internally)?**

REST API → DB → Queue → Worker Engine → Redis → WebSocket → Client

### **Step-by-step:**

1. **Save order in PostgreSQL**

2. **Insert into BullMQ queue** as job: `"execute"`

3. **Worker picks the job**

4. Worker starts:

   * Fetch quotes

   * Determine best route

   * Build transaction

   * Simulate execution

5. Each step produces logs \+ status updates:

   * Written to DB (`logs[]`)

   * Published using Redis Pub/Sub

6. WebSocket clients receive updates instantly

---

# **\#\#\# 2️⃣ WebSocket: `/ws/orders/:orderId`**

This allows clients (frontend or Postman) to receive **real-time updates** for a specific order.

---

## **📌 Purpose**

Listen to order lifecycle events as they happen.

---

## **📥 Connect via WebSocket**

Example URL:

ws://localhost:3000/ws/orders/bbd55a4d-aeba-4aca-8e31-6653dfb7ccb3

Use **Postman's WebSocket tab**, not the normal REST tab.

---

## **📨 Example messages you will receive**

These come from Redis → WebSocket:

### **1\. Routing started**

{  
  "orderId": "bbd55a4d-aeba-4aca-8e31-6653dfb7ccb3",  
  "status": "routing",  
  "message": "Fetching quotes from Raydium & Meteora..."  
}

### **2\. Best route found**

{  
  "orderId": "bbd55a4d-aeba-4aca-8e31-6653dfb7ccb3",  
  "status": "routing",  
  "message": "Best route: Raydium",  
  "chosenDex": "Raydium"  
}

### **3\. Building transaction**

{  
  "orderId": "bbd55a4d-aeba-4aca-8e31-6653dfb7ccb3",  
  "status": "building",  
  "message": "Building transaction..."  
}

### **4\. Submitted**

{  
  "orderId": "bbd55a4d-aeba-4aca-8e31-6653dfb7ccb3",  
  "status": "submitted",  
  "message": "Transaction submitted to network..."  
}

### **5\. Confirmed**

{  
  "orderId": "bbd55a4d-aeba-4aca-8e31-6653dfb7ccb3",  
  "status": "confirmed",  
  "message": "Swap executed successfully",  
  "txHash": "tx\_abc123\_mock",  
  "executionPrice": 147.33  
}

If failure happens:

{  
  "orderId": "bbd55a4d-aeba-4aca-8e31-6653dfb7ccb3",  
  "status": "failed",  
  "message": "Slippage tolerance exceeded"  
}

Great \- moving to the next part.

---

# **✅ 📍 SECTION 3 \- Detailed Order Lifecycle Explanation**

This section breaks down **every internal step** that happens from the moment the client calls  
 `POST /api/orders/execute` until the order is completely processed.

This is the core logic of the entire backend.

---

# **⭐ ORDER LIFECYCLE (Full Internal Flow)**

Below is the **complete execution pipeline**, step-by-step:

---

# **\#\#\# 🔵 Step 1: Client Calls `/api/orders/execute`**

Client sends:

{  
  "inputToken": "SOL",  
  "outputToken": "USDC",  
  "amount": 10,  
  "userId": "user123"  
}

### **Backend does:**

1. Validate input

2. Generate a UUID → `orderId`

3. Write a new row in PostgreSQL:

   * status \= `"pending"`

   * logs \= `{}`

4. Add job to BullMQ:

{  
  "orderId": "...uuid...",  
  "amount": 10  
}

### **Response returned immediately:**

{  
  "orderId": "...uuid...",  
  "status": "pending"  
}

**The backend does NOT wait for execution. Worker handles it.**

---

# **\#\#\# 🔵 Step 2: Worker Picks the Job**

File: `order.worker.ts`

The worker receives:

{  
  "orderId": "uuid",  
  "amount": 10  
}

and begins processing.

---

# **\#\#\# 🔵 Step 3: Worker Emits "Routing" Status**

It broadcasts:

{  
  "status": "routing",  
  "message": "Fetching quotes from Raydium & Meteora...",  
  "orderId": "uuid"  
}

This goes to:

* Redis Pub/Sub

* All WebSocket clients

* Database `logs[]` and `status`

---

# **\#\#\# 🔵 Step 4: Worker Fetches Quotes**

MockDexRouter simulates real DEX calls.

raydium \= await dex.getRaydiumQuote(amount)  
meteora \= await dex.getMeteoraQuote(amount)

Example quotes:

| DEX | Price |
| ----- | ----- |
| Raydium | 148.32 |
| Meteora | 146.91 |

Worker selects the DEX with the **best price** (lowest).

---

# **\#\#\# 🔵 Step 5: Worker Emits "Best Route Found"**

{  
  "status": "routing",  
  "message": "Best route: Meteora",  
  "chosenDex": "Meteora"  
}

Stored in DB \+ broadcast over WebSocket.

---

# **\#\#\# 🔵 Step 6: Worker Emits "Building Transaction"**

Simulates building the transaction:

{  
  "status": "building",  
  "message": "Building transaction..."  
}

Worker waits:

await new Promise(r \=\> setTimeout(r, 500));

---

# **\#\#\# 🔵 Step 7: Worker Emits "Submitted"**

{  
  "status": "submitted",  
  "message": "Transaction submitted to network..."  
}

---

# **\#\#\# 🔵 Step 8: Worker Executes Swap**

From Mock Router:

const { txHash, executedPrice } \= await dex.executeSwap(bestVenue)

This simulates the blockchain execution.

* **txHash** generated

* **executedPrice** random \# within a range

Also includes a 5% chance of failure.

---

# **\#\#\# 🔵 Step 9: Worker Emits "Confirmed"**

{  
  "status": "confirmed",  
  "message": "Swap executed successfully",  
  "executionPrice": 147.23,  
  "txHash": "tx\_x8ckl03\_mock"  
}

This is the final state unless failure occurs.

---

# **\#\#\# 🔵 Step 10: Worker Emits "Failed" (Only if Error)**

If something breaks (example: slippage):

{  
  "status": "failed",  
  "message": "Slippage tolerance exceeded"  
}

DB updated → logs appended → WebSocket notified.

---

# **⭐ Summary Diagram**

Client  
  ↓  
POST /execute  
  ↓  
DB Write (pending)  
  ↓  
Queue (BullMQ)  
  ↓  
Worker  
  → routing  
  → best route  
  → building  
  → submitted  
  → confirmed/failed  
  ↓  
StatusService  
  → Writes logs\[\] to DB  
  → Publishes over Redis Pub/Sub  
  → WS sends to client

Great \- continuing to the next part.

---

# **✅ 📍 SECTION 4 \- Database Schema \+ Table Explanation**

This section explains **your `orders` table** in PostgreSQL in a clean, professional, and very detailed way.

This matches exactly the table **you created manually** and used in your project.

---

# **🗄️ POSTGRES TABLE: `orders`**

CREATE TABLE orders (  
    id SERIAL PRIMARY KEY,  
    order\_id VARCHAR(255) UNIQUE NOT NULL,  
    user\_id VARCHAR(255) NOT NULL,  
    input\_token VARCHAR(50) NOT NULL,  
    output\_token VARCHAR(50) NOT NULL,  
    amount DECIMAL(18, 8\) NOT NULL,  
    status VARCHAR(20) NOT NULL,  
    execution\_price DECIMAL(18, 8),  
    tx\_hash VARCHAR(255),  
    logs TEXT\[\],  
    created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,  
    updated\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

---

# **📌 FIELD-BY-FIELD EXPLANATION**

Below is **exact explanation** of each column, how it is used in your backend, and when it changes.

---

## **1️⃣ id \- SERIAL PRIMARY KEY**

* PostgreSQL internal ID

* Auto-increment

* Not used by client

* Not used by queue

* Only for internal DB management

---

## **2️⃣ order\_id \- UUID (string)**

* This is the **public ID** returned to the client.

* Generated using `uuidv4()` in:

const orderId \= uuidv4();

* Used for:

  * WebSocket channel (`updates:<orderId>`)

  * Queue job routing

  * Status tracking

  * Database updates

**This is the most important field.**

---

## **3️⃣ user\_id \- string**

* User who created the order

* Stored but not validated (as per task)

* Could be connected to real auth in future

* Used only for bookkeeping

---

## **4️⃣ input\_token \- string**

Example: `"SOL"`  
 The token *user wants to sell*.

Used by the worker only for database logging (actual swap simulation doesn’t depend on token names).

---

## **5️⃣ output\_token \- string**

Example: `"USDC"`  
 The token *user wants to receive*.

---

## **6️⃣ amount \- DECIMAL(18,8)**

* Always **positive**

* Backend validates:

if (input.amount \<= 0\) throw new Error("Amount must be greater than zero");

Used for:

* Computing Raydium / Meteora quotes

* Passed into MockDexRouter

---

## **7️⃣ status \- VARCHAR(20)**

Lifecycle progression:

pending →  
routing →  
building →  
submitted →  
confirmed (or failed)

Updated using:

await OrderModel.updateOrder(orderId, { status });

---

## **8️⃣ execution\_price \- DECIMAL(18,8)**

* Final executed price returned by `dex.executeSwap()`

* Set only at **confirmed** stage

* Example:

"executionPrice": 147.3212

---

## **9️⃣ tx\_hash \- string**

Example:

tx\_8sadk12\_mock

Set when transaction is "submitted" and then finalized.

---

## **🔟 logs \- text\[\]**

This is **critical** for tracking progress.

Every time a status update occurs:

logs \= array\_cat(logs, $2::text\[\])

Meaning each status message is appended.

Example logs array after complete order:

{  
  "Fetching quotes from Raydium & Meteora...",  
  "Best route: Raydium",  
  "Building transaction...",  
  "Transaction submitted to network...",  
  "Swap executed successfully"  
}

---

## **1️⃣1️⃣ created\_at \- timestamp**

* Auto-set by PostgreSQL

* When row is first inserted

---

## **1️⃣2️⃣ updated\_at \- timestamp**

* Updated every time worker calls:

updated\_at \= NOW()

---

# **📌 RELATION TO THE WORKER**

Here is how each field is modified by different steps:

| Worker Step | status | logs\[\] | execution\_price | tx\_hash |
| ----- | ----- | ----- | ----- | ----- |
| Job Created | pending | {} | null | null |
| Routing Start | routing | `["Fetching quotes ..."]` | null | null |
| Best Route | routing | `["Best route: ..."]` | null | null |
| Building | building | `["Building transaction..."]` | null | null |
| Submitted | submitted | `["Transaction submitted..."]` | null | (sometimes set here) |
| Confirmed | confirmed | `["Swap executed successfully"]` | set | set |
| Failed | failed | `["<error message>"]` | null | null |

Great \- moving on to the next part.  
---

# **✅ 📍 SECTION 5 \- Redis \+ BullMQ \+ Worker Architecture (Full Deep Explanation)**

This is one of the MOST important parts of your backend.  
 We will explain **exactly how Redis, BullMQ Queue, and the Worker** interact to process an order.

The explanation below is based *entirely on your actual code* \- not generic theory.

---

# **🧠 HIGH-LEVEL FLOW**

When a user creates an order:

1. **API stores the order in PostgreSQL**

2. **API pushes a job to BullMQ queue**

3. **Worker (separate process) receives job**

4. **Worker simulates order routing \+ swap**

5. **Worker updates status via StatusService**

6. **StatusService writes updates to DB \+ publishes to Redis Pub/Sub**

7. **WebSocket server pushes messages to client live**

So Redis plays *two roles*:

✔ Message Queue backend (BullMQ)  
 ✔ Real-time Pub/Sub for WebSocket updates

---

# **🧱 ARCHITECTURE OVERVIEW DIAGRAM**

            ┌────────────────────┐  
             │   API SERVER       │  
             │  Fastify \+ Routes  │  
             └─────────┬──────────┘  
                       |  
                       | 1\. POST /execute  
                       |  
               Save order in DB  
                       |  
                       ▼  
             ┌────────────────────┐  
             │   BullMQ Queue     │  
             │  order-execution   │  
             └─────────┬──────────┘  
                       |  
                       | 2\. queue.add()  
                       |  
                       ▼  
          ┌───────────────────────────┐  
          │        WORKER             │  
          │  order.worker.ts          │  
          └─────────┬─────────────────┘  
                    |  
                    | 3\. Job processing  
                    |  
                    ▼  
         ┌──────────────────────────────┐  
         │      StatusService.emit()    │  
         └─────────┬────────────────────┘  
                   |  
                   | 4\. Publish to Redis Pub/Sub  
                   |    \+ Update PostgreSQL  
                   |  
                   ▼  
         ┌──────────────────────────────┐  
         │     Redis Pub/Sub Channel    │  
         │       updates:\<orderId\>      │  
         └─────────┬────────────────────┘  
                   |  
                   | 5\. WS layer listens  
                   |  
                   ▼  
       ┌──────────────────────────────────┐  
       │  WebSocket Client (Postman/FE)  │  
       └──────────────────────────────────┘

---

# **🟥 REDIS ROLE \#1 \- MESSAGE QUEUE BACKEND (BullMQ)**

Your queue uses Redis **as its storage \+ job broker**.

Your code:

export const orderQueue \= new Queue("order-execution", {  
  connection: new IORedis({  
    host: env.redisHost,  
    port: env.redisPort,  
    maxRetriesPerRequest: null  
  })  
});

This queue stores:

* job data

* retry attempts

* job status

* job progress

Redis here is not doing pub/sub \- it’s doing structured job scheduling.

### **Queue receives:**

{  
  "orderId": "uuid",  
  "inputToken": "SOL",  
  "outputToken": "USDC",  
  "amount": 10,  
  "userId": "1234"  
}

---

# **🟦 REDIS ROLE \#2 \- REAL-TIME PUB/SUB**

This is **separate Redis connection**.

const redisPub \= new IORedis({ host, port });

StatusService publishes updates:

await redisPub.publish(\`updates:${orderId}\`, JSON.stringify(payload));

This is how real-time updates are sent to WebSocket clients.

---

# **🟩 BULLMQ WORKER \- The Heart of the System**

Your worker:

export const orderWorker \= new Worker(  
  "order-execution",  
  async job \=\> { ... },  
  { connection, concurrency: 10 }  
);

This file processes ALL orders.

### **Worker Steps (matching your real logs):**

---

## **1\. ROUTING**

await StatusService.emit(orderId, "routing",  
  "Fetching quotes from Raydium & Meteora..."  
);

* Tells WebSocket: “routing started”

* Appends message to DB

Fetch simulated quotes:

const \[raydium, meteora\] \= await Promise.all(\[  
  dex.getRaydiumQuote(amount),  
  dex.getMeteoraQuote(amount)  
\]);

Pick best route:

await StatusService.emit(orderId, "routing", \`Best route: ${bestQuote.venue}\`);

---

## **2\. BUILDING TRANSACTION**

await StatusService.emit(orderId, "building", "Building transaction...");

Simulates delay:

await new Promise(r \=\> setTimeout(r, 500));

---

## **3\. SUBMITTED**

await StatusService.emit(orderId, "submitted",  
  "Transaction submitted to network..."  
);

---

## **4\. EXECUTE SWAP**

const { txHash, executedPrice } \= await dex.executeSwap(bestQuote.venue);

5% chance to throw:

Slippage tolerance exceeded

Which would update:

StatusService.emit(orderId, "failed", "Slippage tolerance exceeded");

---

## **5\. CONFIRMED**

await StatusService.emit(orderId, "confirmed",  
  "Swap executed successfully",  
  { txHash, executionPrice }  
);

---

# **🟪 WHAT StatusService.emit() REALLY DOES**

This is the most important function in the project.

### **It performs 3 actions:**

---

## **1️⃣ Publish WebSocket update**

redisPub.publish(\`updates:${orderId}\`, JSON.stringify(payload));

Front-end receives real-time messages like:

{  
  "orderId": "abc",  
  "status": "building",  
  "message": "Building transaction..."  
}

---

## **2️⃣ Append message to logs\[\]**

logs: \[message\]

Which results in:

logs \= array\_cat(logs, $2::text\[\])

---

## **3️⃣ Update DB status \+ txHash \+ executionPrice**

OrderModel.updateOrder(orderId, {  
  status,  
  logs,  
  txHash,  
  executionPrice,  
  chosenDex  
});

---

# **🟦 FAILURE HANDLING**

BullMQ automatically retries jobs:

defaultJobOptions: {  
  attempts: 3,  
  backoff: { type: "exponential", delay: 1000 }  
}

This means:

* Fail \#1 → retry after 1s

* Fail \#2 → retry after 2s

* Fail \#3 → retry after 4s

If all fail:

status \= failed  
logs include error message

Continuing now with the next detailed section.

---

# **✅ 📍 SECTION 6 \- WebSocket Architecture & Real-Time Status Updates**

This section fully explains how your backend streams **live order-status updates** to any connected client (Postman, frontend, or any WebSocket client).

---

# **🧠 HIGH-LEVEL OVERVIEW**

Your WebSocket system is built using:

* **Fastify \+ @fastify/websocket**

* **Redis Pub/Sub**

* **StatusService** → publishes real-time messages

* **order.websocket.ts** → WebSocket handler

* **Postman WebSocket client** → receives messages

This gives you a clean, scalable, production-ready real-time stream.

---

# **💡 WHY WE NEED REAL-TIME?**

A swap execution contains multiple states:

pending → routing → building → submitted → confirmed

The user must see these **as they happen**, not through polling or repeated API calls.

WebSockets allow instant updates.

---

# **🧱 ARCHITECTURE DIAGRAM**

      Worker  
   (job processor)  
         │  
         │ calls StatusService.emit()  
         ▼  
  ┌───────────────────┐  
  │  Redis Pub/Sub    │  
  │  channel: updates:\<orderId\>  
  └───────────┬───────┘  
              │  
              │ publishes messages  
              ▼  
   ┌───────────────────────────────┐  
   │  Fastify WebSocket Endpoint   │  
   │  /ws/orders/:orderId          │  
   └─────────────┬─────────────────┘  
                 │  
                 │ forwards messages  
                 ▼  
     ┌───────────────────────┐  
     │   Client (Postman)    │  
     │     WebSocket UI      │  
     └───────────────────────┘

---

# **🧩 STEP 1 \- Worker Generates Status Updates**

Inside `order.worker.ts`:

await StatusService.emit(orderId, "routing", "Fetching quotes...");  
await StatusService.emit(orderId, "building", "Building transaction...");  
await StatusService.emit(orderId, "submitted", "Transaction submitted...");  
await StatusService.emit(orderId, "confirmed", "Swap executed successfully");

Each call emits **one message** to WebSocket.

---

# **🧩 STEP 2 \- StatusService Publishes WebSocket Messages**

From `status.service.ts`:

await redisPub.publish(\`updates:${orderId}\`, JSON.stringify(payload));

This does **not** send to client directly.  
 It sends to Redis Pub/Sub channel:

updates:\<orderId\>

Examples:

updates:abc-123  
updates:957a7328-e8e7-4dd8-bfb6-f38c9d330973

---

# **🧩 STEP 3 \- WebSocket Subscriber Listens for Messages**

`order.websocket.ts`:

subscriber.subscribe(channel);

This subscribes Fastify’s WebSocket handler to one specific order.

---

# **🧩 STEP 4 \- When Redis publishes → WebSocket sends**

Your handler:

subscriber.on("message", (chan, message) \=\> {  
  if (chan \=== channel) {  
    connection.socket.send(message);  
  }  
});

This line is EXACTLY what streams live updates.

---

# **🧩 STEP 5 \- Client receives messages LIVE**

If a client connects to:

ws://localhost:3000/ws/orders/\<orderId\>

They receive messages like:

{  
  "orderId": "957a7328-e8e7-4dd8-bfb6-f38c9d330973",  
  "status": "routing",  
  "message": "Fetching quotes from Raydium & Meteora..."  
}

Then:

{  
  "status": "building",  
  "message": "Building transaction..."  
}

Then:

{  
  "status": "submitted",  
  "message": "Transaction submitted..."  
}

Then:

{  
  "status": "confirmed",  
  "message": "Swap executed successfully",  
  "txHash": "tx\_xxxxx\_mock",  
  "executionPrice": 148.23  
}

---

# **🟨 IMPORTANT: Why WebSocket Didn’t Receive Messages Earlier**

Because:

* You were connecting to wrong URL (`:orderId`)

* Worker started BEFORE WS

* Wrong route mapping

Now everything is fixed and works exactly as intended.

---

# **🧪 HOW TO TEST (Postman)**

### **✔ Step 1 \- Execute order**

POST → `http://localhost:3000/api/orders/execute`

Example body:

{  
  "inputToken": "SOL",  
  "outputToken": "USDC",  
  "amount": 10,  
  "userId": "harsh"  
}

Response:

{  
  "orderId": "957a7328-e8e7-4dd8-bfb6-f38c9d330973",  
  "status": "pending"  
}

---

### **✔ Step 2 \- Open WebSocket**

Use Postman → **WebSocket request**

ws://localhost:3000/ws/orders/957a7328-e8e7-4dd8-bfb6-f38c9d330973

Click **"Connect"**  
 Connection will show:

📡 WebSocket subscribed

---

### **✔ Step 3 \- Start Worker**

npm run worker

You will see messages streaming in Postman:

* “Fetching quotes…”

* “Best route: Meteora”

* “Building transaction…”

* “Submitted…”

* “Swap executed successfully”

---

# **🎯 FINAL RESULT**

You now have:

✔ Real-time order execution  
 ✔ Redis Pub/Sub streaming  
 ✔ WebSocket endpoint  
 ✔ Postman Live Testing  
 ✔ Background worker  
 ✔ Full decoupled architecture  
 ✔ Same design used in production DEX engines

