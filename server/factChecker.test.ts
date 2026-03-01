import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("factChecker router", () => {
  it("should list fact-check reports", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.factChecker.list({
      page: 1,
      limit: 20,
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("reports");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("limit");
    expect(Array.isArray(result.reports)).toBe(true);
  });

  it("should get statistics", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.factChecker.stats();

    expect(stats).toBeDefined();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("verified");
    expect(stats).toHaveProperty("unverified");
    expect(stats).toHaveProperty("bySource");
    expect(typeof stats.total).toBe("number");
  });

  it("should search reports", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.factChecker.search({
      query: "test",
      limit: 20,
    });

    expect(Array.isArray(results)).toBe(true);
  });
});

describe("telegram router", () => {
  it("should register a telegram user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.telegram.registerUser({
      telegramId: "123456789",
      firstName: "Test",
      lastName: "User",
      username: "testuser",
    });

    expect(result).toBeDefined();
  });

  it("should get subscribed users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const users = await caller.telegram.getSubscribedUsers();

    expect(Array.isArray(users)).toBe(true);
  });
});
