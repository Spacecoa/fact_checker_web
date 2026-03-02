import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { factCheckReports } from "../../drizzle/schema";
import { eq, like, desc, and } from "drizzle-orm";
import { collectAndStoreNews } from "../services/newsCollector";
import { verifyAllUnverifiedReports, verifyReport } from "../services/verificationService";
import { triggerJob, getJobStatus, setJobEnabled } from "../services/jobScheduler";

export const reportsRouter = router({
  /**
   * Get all reports with pagination and filtering
   */
  list: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(10),
        source: z.string().optional(),
        status: z.enum(["unverified", "verified", "partially_verified", "false", "no_evidence"]).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const offset = (input.page - 1) * input.limit;
      const conditions = [];

      if (input.source) {
        conditions.push(eq(factCheckReports.source, input.source));
      }
      if (input.status) {
        conditions.push(eq(factCheckReports.verificationStatus, input.status));
      }
      if (input.search) {
        conditions.push(
          like(factCheckReports.title, `%${input.search}%`)
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [reports, totalResult] = await Promise.all([
        db
          .select()
          .from(factCheckReports)
          .where(whereClause)
          .orderBy(desc(factCheckReports.createdAt))
          .limit(input.limit)
          .offset(offset),
        db
          .select()
          .from(factCheckReports)
          .where(whereClause),
      ]);

      return {
        reports,
        total: totalResult.length,
        page: input.page,
        limit: input.limit,
        pages: Math.ceil(totalResult.length / input.limit),
      };
    }),

  /**
   * Get a single report by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(factCheckReports)
        .where(eq(factCheckReports.id, input.id))
        .limit(1);

      return result[0] || null;
    }),

  /**
   * Get statistics about reports
   */
  stats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const allReports = await db.select().from(factCheckReports);

    const stats = {
      total: allReports.length,
      verified: allReports.filter((r) => r.isVerified).length,
      unverified: allReports.filter((r) => !r.isVerified).length,
      byStatus: {
        verified: allReports.filter((r) => r.verificationStatus === "verified").length,
        partially_verified: allReports.filter((r) => r.verificationStatus === "partially_verified").length,
        false: allReports.filter((r) => r.verificationStatus === "false").length,
        no_evidence: allReports.filter((r) => r.verificationStatus === "no_evidence").length,
      },
      bySource: {} as Record<string, number>,
    };

    // Count by source
    for (const report of allReports) {
      stats.bySource[report.source] = (stats.bySource[report.source] || 0) + 1;
    }

    return stats;
  }),

  /**
   * Get unique sources
   */
  sources: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const reports = await db.select().from(factCheckReports);
    const sourcesSet = new Set(reports.map((r) => r.source));
    const sources = Array.from(sourcesSet);

    return sources.sort();
  }),

  /**
   * Manually trigger news collection
   */
  collectNews: publicProcedure.mutation(async () => {
    console.log("[API] Triggering news collection...");
    const count = await collectAndStoreNews();
    return { success: true, collected: count };
  }),

  /**
   * Manually trigger verification of unverified reports
   */
  verifyUnverified: publicProcedure.mutation(async () => {
    console.log("[API] Triggering verification...");
    const count = await verifyAllUnverifiedReports();
    return { success: true, verified: count };
  }),

  /**
   * Verify a specific report
   */
  verifyReport: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      console.log(`[API] Verifying report ${input.id}...`);
      const success = await verifyReport(input.id);
      return { success };
    }),

  /**
   * Get job scheduler status
   */
  jobStatus: publicProcedure.query(async () => {
    return getJobStatus();
  }),

  /**
   * Enable/disable a job
   */
  setJobEnabled: publicProcedure
    .input(z.object({ jobName: z.string(), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const success = setJobEnabled(input.jobName, input.enabled);
      return { success };
    }),

  /**
   * Manually trigger a job
   */
  triggerJob: publicProcedure
    .input(z.object({ jobName: z.string() }))
    .mutation(async ({ input }) => {
      const success = await triggerJob(input.jobName);
      return { success };
    }),

  /**
   * Export reports as JSON
   */
  exportJSON: publicProcedure
    .input(
      z.object({
        status: z.enum(["unverified", "verified", "partially_verified", "false", "no_evidence"]).optional(),
        source: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [];
      if (input.source) conditions.push(eq(factCheckReports.source, input.source));
      if (input.status) conditions.push(eq(factCheckReports.verificationStatus, input.status));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const reports = await db
        .select()
        .from(factCheckReports)
        .where(whereClause);

      return JSON.stringify(reports, null, 2);
    }),

  /**
   * Export reports as CSV
   */
  exportCSV: publicProcedure
    .input(
      z.object({
        status: z.enum(["unverified", "verified", "partially_verified", "false", "no_evidence"]).optional(),
        source: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [];
      if (input.source) conditions.push(eq(factCheckReports.source, input.source));
      if (input.status) conditions.push(eq(factCheckReports.verificationStatus, input.status));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const reports = await db
        .select()
        .from(factCheckReports)
        .where(whereClause);

      // Build CSV header
      const headers = [
        "ID",
        "Título",
        "Alegação Principal",
        "Fonte",
        "Status",
        "Verificado",
        "Data de Criação",
      ];

      // Build CSV rows
      const rows = reports.map((r) => [
        r.id,
        `"${r.title.replace(/"/g, '""')}"`,
        `"${r.mainClaim.replace(/"/g, '""')}"`,
        r.source,
        r.verificationStatus,
        r.isVerified ? "Sim" : "Não",
        r.createdAt?.toISOString() || "",
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      return csv;
    }),

  /**
   * Export reports as Markdown
   */
  exportMarkdown: publicProcedure
    .input(
      z.object({
        status: z.enum(["unverified", "verified", "partially_verified", "false", "no_evidence"]).optional(),
        source: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [];
      if (input.source) conditions.push(eq(factCheckReports.source, input.source));
      if (input.status) conditions.push(eq(factCheckReports.verificationStatus, input.status));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const reports = await db
        .select()
        .from(factCheckReports)
        .where(whereClause);

      let markdown = "# Relatório de Fact-Checking\n\n";
      markdown += `**Data de Geração:** ${new Date().toLocaleString("pt-BR")}\n\n`;
      markdown += `**Total de Relatórios:** ${reports.length}\n\n`;

      markdown += "## Relatórios\n\n";

      for (const report of reports) {
        markdown += `### ${report.title}\n\n`;
        markdown += `**Fonte:** ${report.source}\n\n`;
        markdown += `**Alegação Principal:** ${report.mainClaim}\n\n`;
        markdown += `**Status:** ${report.verificationStatus}\n\n`;
        markdown += `**Verificado:** ${report.isVerified ? "✅ Sim" : "❌ Não"}\n\n`;

        if (report.summary) {
          markdown += `**Resumo:** ${report.summary}\n\n`;
        }

        if (report.llmAnalysis) {
          markdown += `**Análise:** ${report.llmAnalysis}\n\n`;
        }

        markdown += "---\n\n";
      }

      return markdown;
    }),
});
