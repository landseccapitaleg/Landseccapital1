// Export your models here. Add one export per file
// export * from "./posts";
//
// Each model/table should ideally be split into different files.
// Each model/table should define a Drizzle table, insert schema, and types:
//
//   import { pgTable, text, serial } from "drizzle-orm/pg-core";
//   import { createInsertSchema } from "drizzle-zod";
//   import { z } from "zod/v4";
//
//   export const postsTable = pgTable("posts", {
//     id: serial("id").primaryKey(),
//     title: text("title").notNull(),
//   });
//
//   export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true });
//   export type InsertPost = z.infer<typeof insertPostSchema>;
//   export type Post = typeof postsTable.$inferSelect;

import { bigint, jsonb, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  country: text("country").notNull().default(""),
  phone: text("phone").notNull().default(""),
  plan: text("plan").notNull().default("Foundation Plan"),
  investedAmount: numeric("invested_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  withdrawableProfit: numeric("withdrawable_profit", { precision: 14, scale: 2 }).notNull().default("0"),
  totalReturns: numeric("total_returns", { precision: 14, scale: 2 }).notNull().default("0"),
  investmentStartDate: text("investment_start_date").notNull(),
  maturityDate: text("maturity_date").notNull(),
  joinDate: text("join_date").notNull(),
  lastProfitAt: bigint("last_profit_at", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserRecord = typeof usersTable.$inferSelect;

/** Requests are deliberately append-only records; status changes are audited in updatedAt. */
export const depositsTable = pgTable("deposits", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  method: text("method").notNull(),
  reference: text("reference").notNull(),
  status: text("status").notNull().default("pending"),
  note: text("note"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const withdrawalsTable = pgTable("withdrawals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  method: text("method").notNull(),
  destination: text("destination").notNull(),
  status: text("status").notNull().default("pending"),
  note: text("note"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const kycRequestsTable = pgTable("kyc_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  documentType: text("document_type").notNull(),
  dob: text("dob").notNull(),
  nationality: text("nationality").notNull(),
  phone: text("phone").notNull(),
  documents: jsonb("documents").$type<Record<string, unknown>>().notNull().default({}),
  status: text("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const transactionsTable = pgTable("transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id),
  type: text("type").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  reference: text("reference"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const siteSettingsTable = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Deposit = typeof depositsTable.$inferSelect;
export type Withdrawal = typeof withdrawalsTable.$inferSelect;
export type KycRequest = typeof kycRequestsTable.$inferSelect;
export type Transaction = typeof transactionsTable.$inferSelect;