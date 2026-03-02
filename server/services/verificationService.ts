import axios from "axios";
import { getDb } from "../db";
import { factCheckReports } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

interface FactCheckResult {
  claim: string;
  claimReview: Array<{
    publisher: {
      name: string;
      site: string;
    };
    url: string;
    textualRating: string;
    languageCode: string;
  }>;
}

/**
 * Extract key claims from text using LLM
 */
export async function extractClaimsWithLLM(text: string): Promise<{
  mainClaim: string;
  keywords: string[];
  analysis: string;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert fact-checker. Extract the main political claim from the text and identify key keywords. Return a JSON response.",
        },
        {
          role: "user",
          content: `Extract the main claim and keywords from this news text:\n\n${text}\n\nRespond in Portuguese with JSON format: {"mainClaim": "...", "keywords": [...], "analysis": "..."}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "claim_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              mainClaim: {
                type: "string",
                description: "The main political claim",
              },
              keywords: {
                type: "array",
                items: { type: "string" },
                description: "Key terms and keywords",
              },
              analysis: {
                type: "string",
                description: "Brief analysis of the claim",
              },
            },
            required: ["mainClaim", "keywords", "analysis"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from LLM");

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr);
    return {
      mainClaim: parsed.mainClaim || "",
      keywords: parsed.keywords || [],
      analysis: parsed.analysis || "",
    };
  } catch (error) {
    console.error("[VerificationService] LLM extraction error:", error);
    return {
      mainClaim: "",
      keywords: [],
      analysis: "",
    };
  }
}

/**
 * Verify claims using Google Fact Check API
 */
export async function verifyWithGoogleFactCheck(
  claim: string
): Promise<FactCheckResult[]> {
  try {
    const apiKey = process.env.GOOGLE_FACT_CHECK_API_KEY;
    if (!apiKey) {
      console.warn("[VerificationService] Google Fact Check API key not configured");
      return [];
    }

    const response = await axios.get(
      "https://factchecktools.googleapis.com/v1alpha1/claims:search",
      {
        params: {
          query: claim,
          pageSize: 5,
          key: apiKey,
          languageCode: "pt",
        },
        timeout: 10000,
      }
    );

    return response.data.claims || [];
  } catch (error) {
    console.error("[VerificationService] Google Fact Check API error:", error);
    return [];
  }
}

/**
 * Determine verification status based on fact-check results
 */
export function determineVerificationStatus(
  results: FactCheckResult[]
): "verified" | "partially_verified" | "false" | "no_evidence" {
  if (results.length === 0) {
    return "no_evidence";
  }

  const ratings = results
    .flatMap((r) => r.claimReview)
    .map((r) => r.textualRating?.toLowerCase() || "");

  const hasTrue = ratings.some((r) => r.includes("verdadeiro") || r.includes("true"));
  const hasFalse = ratings.some((r) => r.includes("falso") || r.includes("false"));
  const hasPartial = ratings.some(
    (r) =>
      r.includes("parcialmente") ||
      r.includes("partially") ||
      r.includes("mixed") ||
      r.includes("misto")
  );

  if (hasFalse && !hasTrue) {
    return "false";
  }
  if (hasTrue && !hasFalse && !hasPartial) {
    return "verified";
  }
  if (hasPartial || (hasTrue && hasFalse)) {
    return "partially_verified";
  }

  return "verified";
}

/**
 * Verify a single report
 */
export async function verifyReport(reportId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[VerificationService] Database not available");
      return false;
    }

    // Get the report
    const reports = await db
      .select()
      .from(factCheckReports)
      .where(eq(factCheckReports.id, reportId))
      .limit(1);

    if (reports.length === 0) {
      console.warn(`[VerificationService] Report ${reportId} not found`);
      return false;
    }

    const report = reports[0];
    console.log(`[VerificationService] Verifying report: ${report.title}`);

    // Extract claims with LLM
    const claimData = await extractClaimsWithLLM(
      report.summary || report.mainClaim
    );

    // Verify with Google Fact Check API
    const factCheckResults = await verifyWithGoogleFactCheck(claimData.mainClaim);

    // Determine verification status
    const verificationStatus = determineVerificationStatus(factCheckResults);

    // Update report
    await db
      .update(factCheckReports)
      .set({
        llmAnalysis: claimData.analysis,
        keywords: claimData.keywords,
        factCheckResults: factCheckResults,
        verificationStatus: verificationStatus,
        isVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(factCheckReports.id, reportId));

    console.log(
      `[VerificationService] Report ${reportId} verified with status: ${verificationStatus}`
    );
    return true;
  } catch (error) {
    console.error(`[VerificationService] Error verifying report ${reportId}:`, error);
    return false;
  }
}

/**
 * Verify all unverified reports
 */
export async function verifyAllUnverifiedReports(): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[VerificationService] Database not available");
      return 0;
    }

    // Get all unverified reports
    const unverifiedReports = await db
      .select()
      .from(factCheckReports)
      .where(eq(factCheckReports.isVerified, false))
      .limit(10); // Process 10 at a time to avoid rate limits

    console.log(
      `[VerificationService] Found ${unverifiedReports.length} unverified reports`
    );

    let verifiedCount = 0;
    for (const report of unverifiedReports) {
      const success = await verifyReport(report.id);
      if (success) {
        verifiedCount++;
      }
      // Add delay between API calls
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(
      `[VerificationService] Verification completed. Verified: ${verifiedCount}`
    );
    return verifiedCount;
  } catch (error) {
    console.error("[VerificationService] Error in batch verification:", error);
    return 0;
  }
}
