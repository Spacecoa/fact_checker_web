import axios from "axios";
import { getFactCheckReports, getFactCheckReportStats, getTelegramUserByTelegramId } from "../db";

const TELEGRAM_API_URL = "https://api.telegram.org/bot";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.warn("[TelegramBot] TELEGRAM_BOT_TOKEN not set. Bot functionality disabled.");
}

/**
 * Send a message to a Telegram user
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options?: {
    parseMode?: "HTML" | "Markdown" | "MarkdownV2";
    replyMarkup?: any;
  }
): Promise<boolean> {
  if (!BOT_TOKEN) {
    console.warn("[TelegramBot] Cannot send message: BOT_TOKEN not configured");
    return false;
  }

  try {
    const response = await axios.post(`${TELEGRAM_API_URL}${BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: options?.parseMode || "HTML",
      reply_markup: options?.replyMarkup,
    });

    return response.status === 200;
  } catch (error) {
    console.error("[TelegramBot] Failed to send message:", error);
    return false;
  }
}

/**
 * Send a formatted report summary to Telegram
 */
export async function sendReportNotification(
  chatId: string | number,
  reportId: string | number,
  title: string,
  mainClaim: string,
  source: string
): Promise<boolean> {
  const message = `
<b>📰 Novo Relatório de Fact-Checking</b>

<b>Título:</b> ${escapeHtml(title)}

<b>Alegação Principal:</b> ${escapeHtml(mainClaim)}

<b>Fonte:</b> ${escapeHtml(source)}

<b>ID do Relatório:</b> <code>${reportId}</code>

Visite o dashboard para mais detalhes.
  `.trim();

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "Ver Relatório",
          url: `${process.env.VITE_FRONTEND_URL || "http://localhost:3000"}/reports/${reportId}`,
        },
      ],
    ],
  };

  return sendTelegramMessage(chatId, message, {
    parseMode: "HTML",
    replyMarkup: keyboard,
  });
}

/**
 * Send statistics to Telegram
 */
export async function sendStatsMessage(chatId: string | number): Promise<boolean> {
  const stats = await getFactCheckReportStats();

  const message = `
<b>📊 Estatísticas de Fact-Checking</b>

<b>Total de Relatórios:</b> ${stats.total}
<b>Verificados:</b> ${stats.verified}
<b>Não Verificados:</b> ${stats.unverified}

<b>Por Fonte:</b>
${Object.entries(stats.bySource)
  .map(([source, count]) => `• ${escapeHtml(source)}: ${count}`)
  .join("\n")}
  `.trim();

  return sendTelegramMessage(chatId, message, { parseMode: "HTML" });
}

/**
 * Send latest reports to Telegram
 */
export async function sendLatestReportsMessage(chatId: string | number, limit: number = 5): Promise<boolean> {
  const reports = await getFactCheckReports(limit, 0);

  if (reports.length === 0) {
    return sendTelegramMessage(chatId, "Nenhum relatório disponível no momento.", {
      parseMode: "HTML",
    });
  }

  const reportsList = reports
    .map(
      (r, idx) =>
        `${idx + 1}. <b>${escapeHtml(r.title.substring(0, 50))}</b>\n   Fonte: ${escapeHtml(r.source)}\n   Status: ${r.verificationStatus}`
    )
    .join("\n\n");

  const message = `
<b>📰 Últimos Relatórios</b>

${reportsList}

Visite o dashboard para mais detalhes.
  `.trim();

  return sendTelegramMessage(chatId, message, { parseMode: "HTML" });
}

/**
 * Send search results to Telegram
 */
export async function sendSearchResultsMessage(
  chatId: string | number,
  query: string,
  results: any[]
): Promise<boolean> {
  if (results.length === 0) {
    return sendTelegramMessage(chatId, `Nenhum resultado encontrado para "${escapeHtml(query)}"`, {
      parseMode: "HTML",
    });
  }

  const resultsList = results
    .slice(0, 5)
    .map(
      (r, idx) =>
        `${idx + 1}. <b>${escapeHtml(r.title.substring(0, 50))}</b>\n   Fonte: ${escapeHtml(r.source)}`
    )
    .join("\n\n");

  const message = `
<b>🔍 Resultados da Busca</b>

Busca por: "${escapeHtml(query)}"

${resultsList}

${results.length > 5 ? `\n... e mais ${results.length - 5} resultados. Visite o dashboard para ver todos.` : ""}
  `.trim();

  return sendTelegramMessage(chatId, message, { parseMode: "HTML" });
}

/**
 * Broadcast a message to all subscribed users
 */
export async function broadcastMessage(text: string, userIds: string[]): Promise<number> {
  let successCount = 0;

  for (const userId of userIds) {
    const success = await sendTelegramMessage(userId, text, { parseMode: "HTML" });
    if (success) successCount++;
  }

  return successCount;
}

/**
 * Escape HTML special characters for Telegram
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Handle Telegram webhook updates
 */
export async function handleTelegramUpdate(update: any): Promise<void> {
  try {
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const text = message.text || "";
      const user = message.from;

      // Handle commands
      if (text.startsWith("/start")) {
        await sendTelegramMessage(
          chatId,
          `Bem-vindo ao Fact Checker Bot! 🤖\n\nComandos disponíveis:\n/latest - Últimos relatórios\n/stats - Estatísticas\n/search - Buscar relatórios\n/subscribe - Ativar notificações\n/unsubscribe - Desativar notificações`,
          { parseMode: "HTML" }
        );
      } else if (text.startsWith("/latest")) {
        await sendLatestReportsMessage(chatId);
      } else if (text.startsWith("/stats")) {
        await sendStatsMessage(chatId);
      } else if (text.startsWith("/subscribe")) {
        await sendTelegramMessage(chatId, "✅ Você foi inscrito nas notificações!", {
          parseMode: "HTML",
        });
      } else if (text.startsWith("/unsubscribe")) {
        await sendTelegramMessage(chatId, "❌ Você foi desinscrito das notificações.", {
          parseMode: "HTML",
        });
      }
    }
  } catch (error) {
    console.error("[TelegramBot] Error handling update:", error);
  }
}
