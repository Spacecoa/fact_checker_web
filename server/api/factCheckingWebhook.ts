import { Router, Request, Response } from "express";
import { createFactCheckReport, getSubscribedTelegramUsers } from "../db";
import { sendReportNotification } from "../services/telegramBot";
import { nanoid } from "nanoid";

const router = Router();

/**
 * Webhook endpoint to receive fact-checking reports from the fact-checking program
 * POST /api/webhook/fact-check
 */
router.post("/fact-check", async (req: Request, res: Response) => {
  try {
    const {
      title,
      mainClaim,
      source,
      newsLink,
      summary,
      llmAnalysis,
      keywords,
      isVerified,
      factCheckResults,
      verificationStatus,
    } = req.body;

    // Validate required fields
    if (!title || !mainClaim || !source) {
      return res.status(400).json({
        error: "Missing required fields: title, mainClaim, source",
      });
    }

    // Generate unique report ID
    const reportId = nanoid(12);

    // Create report in database
    await createFactCheckReport({
      reportId,
      title,
      mainClaim,
      source,
      newsLink,
      summary,
      llmAnalysis,
      keywords,
      isVerified: isVerified ?? false,
      factCheckResults,
      verificationStatus: verificationStatus ?? "unverified",
      reportDate: new Date(),
    });

    // Notify subscribed Telegram users
    const telegramUsers = await getSubscribedTelegramUsers();
    for (const user of telegramUsers) {
      await sendReportNotification(user.telegramId, reportId, title, mainClaim, source);
    }

    return res.status(201).json({
      success: true,
      reportId,
      message: "Report received and processed successfully",
    });
  } catch (error) {
    console.error("[Webhook] Error processing fact-check report:", error);
    return res.status(500).json({
      error: "Failed to process report",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Webhook endpoint for Telegram bot updates
 * POST /api/webhook/telegram
 */
router.post("/telegram", async (req: Request, res: Response) => {
  try {
    const update = req.body;

    // Verify the update is from Telegram
    if (!update.update_id) {
      return res.status(400).json({ error: "Invalid Telegram update" });
    }

    // Import and handle the update
    const { handleTelegramUpdate } = await import("../services/telegramBot");
    await handleTelegramUpdate(update);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[Webhook] Error processing Telegram update:", error);
    return res.status(500).json({
      error: "Failed to process Telegram update",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Health check endpoint
 * GET /api/webhook/health
 */
router.get("/health", (req: Request, res: Response) => {
  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

export default router;
