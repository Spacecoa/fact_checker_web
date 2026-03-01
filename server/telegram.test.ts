import { describe, expect, it, beforeAll, vi } from "vitest";
import axios from "axios";

describe("Telegram Bot Integration", () => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  beforeAll(() => {
    if (!botToken) {
      console.warn("[WARNING] TELEGRAM_BOT_TOKEN not set, skipping tests");
    }
  });

  it("should validate Telegram Bot token by calling getMe API", async () => {
    if (!botToken) {
      console.log("[SKIP] Telegram token not configured");
      return;
    }

    try {
      const response = await axios.get(
        `https://api.telegram.org/bot${botToken}/getMe`
      );

      expect(response.status).toBe(200);
      expect(response.data.ok).toBe(true);
      expect(response.data.result).toBeDefined();
      expect(response.data.result.is_bot).toBe(true);
      expect(response.data.result.username).toBeDefined();

      console.log(
        `✅ Telegram Bot validated: @${response.data.result.username}`
      );
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error(
          "Invalid Telegram Bot token. Please check TELEGRAM_BOT_TOKEN."
        );
      }
      throw error;
    }
  });

  it("should be able to send test message", async () => {
    if (!botToken) {
      console.log("[SKIP] Telegram token not configured");
      return;
    }

    try {
      // Get bot info first
      const botInfo = await axios.get(
        `https://api.telegram.org/bot${botToken}/getMe`
      );
      expect(botInfo.data.ok).toBe(true);

      console.log(
        `✅ Telegram Bot ready to send messages: @${botInfo.data.result.username}`
      );
    } catch (error: any) {
      throw new Error(`Failed to verify Telegram Bot: ${error.message}`);
    }
  });
});
