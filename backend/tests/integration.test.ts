import supertest from "supertest";
import { buildServer } from "../src/server";

describe("Full Integration", () => {
  const app = buildServer();

  it("should create an order successfully", async () => {
    const res = await supertest(app.server)
      .post("/api/orders/execute")
      .send({
        inputToken: "SOL",
        outputToken: "USDC",
        amount: 1,
        userId: "abc"
      });

    expect(res.status).toBe(202);
    expect(res.body.orderId).toBeDefined();
  });
});
