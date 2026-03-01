import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, factCheckReports, InsertFactCheckReport, telegramUsers, InsertTelegramUser } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Fact-checking reports queries
export async function getFactCheckReports(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select().from(factCheckReports).orderBy((t) => t.createdAt).limit(limit).offset(offset);
  return results;
}

export async function getFactCheckReportById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const results = await db.select().from(factCheckReports).where(eq(factCheckReports.id, id)).limit(1);
  return results.length > 0 ? results[0] : undefined;
}

export async function getFactCheckReportByReportId(reportId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const results = await db.select().from(factCheckReports).where(eq(factCheckReports.reportId, reportId)).limit(1);
  return results.length > 0 ? results[0] : undefined;
}

export async function createFactCheckReport(report: InsertFactCheckReport) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(factCheckReports).values(report);
  return result;
}

export async function updateFactCheckReport(id: number, data: Partial<InsertFactCheckReport>) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.update(factCheckReports).set(data).where(eq(factCheckReports.id, id));
  return result;
}

export async function getFactCheckReportStats() {
  const db = await getDb();
  if (!db) return { total: 0, verified: 0, unverified: 0, bySource: {} };
  
  const reports = await db.select().from(factCheckReports);
  const total = reports.length;
  const verified = reports.filter(r => r.isVerified).length;
  const unverified = total - verified;
  
  const bySource: Record<string, number> = {};
  reports.forEach(r => {
    bySource[r.source] = (bySource[r.source] || 0) + 1;
  });
  
  return { total, verified, unverified, bySource };
}

// Telegram users queries
export async function getTelegramUserByTelegramId(telegramId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const results = await db.select().from(telegramUsers).where(eq(telegramUsers.telegramId, telegramId)).limit(1);
  return results.length > 0 ? results[0] : undefined;
}

export async function createOrUpdateTelegramUser(user: InsertTelegramUser) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(telegramUsers).values(user).onDuplicateKeyUpdate({
    set: {
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      updatedAt: new Date(),
    },
  });
  return result;
}

export async function getSubscribedTelegramUsers() {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select().from(telegramUsers).where(eq(telegramUsers.isSubscribed, true));
  return results;
}

// TODO: add feature queries here as your schema grows.
