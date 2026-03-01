import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, decimal, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Fact-checking reports table - stores complete reports from the fact-checking program
 */
export const factCheckReports = mysqlTable(
  "fact_check_reports",
  {
    id: int("id").autoincrement().primaryKey(),
    reportId: varchar("reportId", { length: 64 }).notNull().unique(), // Unique identifier for each report
    title: text("title").notNull(),
    mainClaim: text("mainClaim").notNull(),
    source: varchar("source", { length: 255 }).notNull(), // News source (G1, Folha, etc)
    newsLink: varchar("newsLink", { length: 512 }),
    summary: text("summary"),
    llmAnalysis: text("llmAnalysis"), // Analysis from the LLM
    keywords: json("keywords"), // Array of keywords
    isVerified: boolean("isVerified").default(false), // Whether fact-checks were found
    factCheckResults: json("factCheckResults"), // Results from Google Fact Check API
    verificationStatus: mysqlEnum("verificationStatus", ["unverified", "verified", "partially_verified", "false", "no_evidence"]).default("unverified"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    reportDate: timestamp("reportDate"), // When the report was generated
  },
  (table) => ({
    sourceIdx: index("source_idx").on(table.source),
    createdAtIdx: index("createdAt_idx").on(table.createdAt),
    verificationStatusIdx: index("verificationStatus_idx").on(table.verificationStatus),
  })
);

export type FactCheckReport = typeof factCheckReports.$inferSelect;
export type InsertFactCheckReport = typeof factCheckReports.$inferInsert;

/**
 * Telegram users table - tracks users subscribed to the bot
 */
export const telegramUsers = mysqlTable(
  "telegram_users",
  {
    id: int("id").autoincrement().primaryKey(),
    telegramId: varchar("telegramId", { length: 64 }).notNull().unique(),
    firstName: varchar("firstName", { length: 255 }),
    lastName: varchar("lastName", { length: 255 }),
    username: varchar("username", { length: 255 }),
    isSubscribed: boolean("isSubscribed").default(true),
    preferences: json("preferences"), // User preferences (notification settings, filters, etc)
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    telegramIdIdx: index("telegramId_idx").on(table.telegramId),
  })
);

export type TelegramUser = typeof telegramUsers.$inferSelect;
export type InsertTelegramUser = typeof telegramUsers.$inferInsert;

/**
 * Telegram notifications table - tracks sent notifications
 */
export const telegramNotifications = mysqlTable(
  "telegram_notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    telegramUserId: int("telegramUserId").notNull(),
    reportId: int("reportId").notNull(),
    messageId: varchar("messageId", { length: 255 }),
    status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    sentAt: timestamp("sentAt"),
  },
  (table) => ({
    telegramUserIdIdx: index("telegramUserId_idx").on(table.telegramUserId),
    reportIdIdx: index("reportId_idx").on(table.reportId),
  })
);

export type TelegramNotification = typeof telegramNotifications.$inferSelect;
export type InsertTelegramNotification = typeof telegramNotifications.$inferInsert;