import axios from "axios";
import * as xml2js from "xml2js";
import { getDb } from "../db";
import { factCheckReports } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
}

interface RSSSource {
  name: string;
  url: string;
}

// Brazilian political news RSS sources
const RSS_SOURCES: RSSSource[] = [
  {
    name: "G1 Política",
    url: "https://g1.globo.com/politica/rss2.xml",
  },
  {
    name: "Folha de S.Paulo",
    url: "https://feeds.folha.uol.com.br/poder/rss091.xml",
  },
  {
    name: "O Globo",
    url: "https://oglobo.globo.com/rss/feeds/politica.xml",
  },
  {
    name: "UOL Notícias",
    url: "https://noticias.uol.com.br/politica/index.xml",
  },
  {
    name: "Estadão",
    url: "https://rss.estadao.com.br/cidades/",
  },
];

const xmlParser = new xml2js.Parser({ explicitArray: false });

export async function collectNewsFromRSS(): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];

  for (const source of RSS_SOURCES) {
    try {
      console.log(`[NewsCollector] Fetching from ${source.name}...`);

      const response = await axios.get(source.url, {
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const parsed = await xmlParser.parseStringPromise(response.data);

      // Handle different RSS structures
      const items = parsed.rss?.channel?.item || [];
      const itemArray = Array.isArray(items) ? items : [items];

      for (const item of itemArray) {
        if (item.title && item.link) {
          allNews.push({
            title: item.title,
            link: item.link,
            description: item.description || item.summary || "",
            pubDate: item.pubDate || new Date().toISOString(),
            source: source.name,
          });
        }
      }

      console.log(`[NewsCollector] Found ${itemArray.length} items from ${source.name}`);
    } catch (error) {
      console.error(`[NewsCollector] Error fetching from ${source.name}:`, error);
    }
  }

  return allNews;
}

export async function storeNewsInDatabase(news: NewsItem[]): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[NewsCollector] Database not available");
    return 0;
  }

  let storedCount = 0;

  for (const item of news) {
    try {
      // Check if news already exists
      const existing = await db
        .select()
        .from(factCheckReports)
        .where(eq(factCheckReports.newsLink, item.link))
        .limit(1);

      if (existing.length === 0) {
        // Generate a unique report ID
        const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        await db.insert(factCheckReports).values({
          title: item.title,
          mainClaim: item.description.substring(0, 500),
          summary: item.description,
          source: item.source,
          newsLink: item.link,
          reportId: reportId,
          verificationStatus: "unverified",
          isVerified: false,
          createdAt: new Date(item.pubDate),
          updatedAt: new Date(),
        });

        storedCount++;
        console.log(`[NewsCollector] Stored news: ${item.title}`);
      }
    } catch (error) {
      console.error(`[NewsCollector] Error storing news: ${item.title}`, error);
    }
  }

  console.log(`[NewsCollector] Successfully stored ${storedCount} new items`);
  return storedCount;
}

export async function collectAndStoreNews(): Promise<number> {
  try {
    console.log("[NewsCollector] Starting news collection...");
    const news = await collectNewsFromRSS();
    console.log(`[NewsCollector] Collected ${news.length} items total`);

    const stored = await storeNewsInDatabase(news);
    console.log(`[NewsCollector] Collection completed. Stored: ${stored}`);

    return stored;
  } catch (error) {
    console.error("[NewsCollector] Fatal error during collection:", error);
    return 0;
  }
}
