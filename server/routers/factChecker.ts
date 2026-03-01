import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getFactCheckReports,
  getFactCheckReportById,
  createFactCheckReport,
  updateFactCheckReport,
  getFactCheckReportStats,
} from "../db";

export const factCheckerRouter = router({
  // Get paginated list of reports with optional filtering
  list: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
        source: z.string().optional(),
        verificationStatus: z.enum(["unverified", "verified", "partially_verified", "false", "no_evidence"]).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;
      const reports = await getFactCheckReports(input.limit, offset);
      
      // Filter by source if provided
      let filtered = reports;
      if (input.source) {
        filtered = filtered.filter(r => r.source === input.source);
      }
      
      // Filter by verification status if provided
      if (input.verificationStatus) {
        filtered = filtered.filter(r => r.verificationStatus === input.verificationStatus);
      }
      
      // Search in title, mainClaim, and summary
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        filtered = filtered.filter(r =>
          r.title.toLowerCase().includes(searchLower) ||
          r.mainClaim.toLowerCase().includes(searchLower) ||
          (r.summary?.toLowerCase().includes(searchLower) ?? false)
        );
      }
      
      return {
        reports: filtered,
        total: filtered.length,
        page: input.page,
        limit: input.limit,
      };
    }),

  // Get single report by ID
  getById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      return await getFactCheckReportById(input.id);
    }),

  // Create new report (from fact-checking program)
  create: publicProcedure
    .input(
      z.object({
        reportId: z.string(),
        title: z.string(),
        mainClaim: z.string(),
        source: z.string(),
        newsLink: z.string().optional(),
        summary: z.string().optional(),
        llmAnalysis: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        isVerified: z.boolean().optional(),
        factCheckResults: z.any().optional(),
        verificationStatus: z.enum(["unverified", "verified", "partially_verified", "false", "no_evidence"]).optional(),
        reportDate: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await createFactCheckReport({
        reportId: input.reportId,
        title: input.title,
        mainClaim: input.mainClaim,
        source: input.source,
        newsLink: input.newsLink,
        summary: input.summary,
        llmAnalysis: input.llmAnalysis,
        keywords: input.keywords,
        isVerified: input.isVerified,
        factCheckResults: input.factCheckResults,
        verificationStatus: input.verificationStatus,
        reportDate: input.reportDate,
      });
    }),

  // Update existing report
  update: publicProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        verificationStatus: z.enum(["unverified", "verified", "partially_verified", "false", "no_evidence"]).optional(),
        isVerified: z.boolean().optional(),
        factCheckResults: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await updateFactCheckReport(id, data);
    }),

  // Get statistics
  stats: publicProcedure.query(async () => {
    return await getFactCheckReportStats();
  }),

  // Search reports
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().int().positive().max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const reports = await getFactCheckReports(1000, 0); // Get all for search
      const queryLower = input.query.toLowerCase();
      
      const results = reports
        .filter(r =>
          r.title.toLowerCase().includes(queryLower) ||
          r.mainClaim.toLowerCase().includes(queryLower) ||
          (r.summary?.toLowerCase().includes(queryLower) ?? false) ||
          r.source.toLowerCase().includes(queryLower)
        )
        .slice(0, input.limit);
      
      return results;
    }),

  // Get reports by source
  getBySource: publicProcedure
    .input(z.object({ source: z.string() }))
    .query(async ({ input }) => {
      const reports = await getFactCheckReports(1000, 0);
      return reports.filter(r => r.source === input.source);
    }),

  // Get reports by date range
  getByDateRange: publicProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input }) => {
      const reports = await getFactCheckReports(1000, 0);
      return reports.filter(r => {
        const reportDate = r.reportDate || r.createdAt;
        return reportDate >= input.startDate && reportDate <= input.endDate;
      });
    }),
});
