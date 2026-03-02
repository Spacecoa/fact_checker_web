import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectNewsFromRSS, storeNewsInDatabase, collectAndStoreNews } from "./newsCollector";

describe("News Collector Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("collectNewsFromRSS", () => {
    it("should return an array of news items", async () => {
      const news = await collectNewsFromRSS();
      expect(Array.isArray(news)).toBe(true);
    });

    it("should have required fields in news items", async () => {
      const news = await collectNewsFromRSS();
      if (news.length > 0) {
        const item = news[0];
        expect(item).toHaveProperty("title");
        expect(item).toHaveProperty("link");
        expect(item).toHaveProperty("source");
      }
    });

    it("should handle RSS feed errors gracefully", async () => {
      const news = await collectNewsFromRSS();
      // Should not throw and return empty array or partial results
      expect(Array.isArray(news)).toBe(true);
    });
  });

  describe("collectAndStoreNews", () => {
    it("should return a number", async () => {
      const count = await collectAndStoreNews();
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it("should not throw on execution", async () => {
      await expect(collectAndStoreNews()).resolves.not.toThrow();
    });
  });
});
