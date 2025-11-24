import { pg } from "../src/db/postgres";

describe("Database", () => {
  it("should connect to postgres", async () => {
    const client = await pg.connect();
    client.release();
    expect(true).toBe(true);
  });
});
