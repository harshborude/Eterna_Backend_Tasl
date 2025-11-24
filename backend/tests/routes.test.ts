import { buildServer } from "../src/server";
import supertest from "supertest";

describe("Order Routes", () => {
  const app = buildServer();

  it("should return 400 for empty payload", async () => {
    const res = await supertest(app.server)
      .post("/api/orders/execute")
      .send({});

    expect(res.status).toBe(400);
  });
});
