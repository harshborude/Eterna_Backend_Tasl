import { StatusService } from "../src/services/status.service";

describe("Status Service", () => {
  it("should emit status without throwing", async () => {
    await expect(
      StatusService.emit("test-id", "routing", "Testing message")
    ).resolves.not.toThrow();
  });
});
