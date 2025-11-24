import { buildServer } from "../src/server";

describe("WebSocket Route", () => {
  it("should register WS route", async () => {
    const app = buildServer();
    const routes = app.printRoutes();

    expect(routes.includes("ws/orders/:orderId")).toBe(true);
  });
});
