// @ts-nocheck
import crypto from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  depositsTable,
  ensureDatabase,
  kycRequestsTable,
  siteSettingsTable,
  transactionsTable,
  usersTable,
  withdrawalsTable,
} from "../db/src";
import { findUserBySession, publicUser } from "../db/src/user-auth";
import { readSession } from "./admin-auth";

export function body(req: any) {
  if (!req.body) return {};
  if (typeof req.body === "string") return JSON.parse(req.body);
  return req.body;
}

export function fail(res: any, status: number, error: string) {
  return res.status(status).json({ error });
}

export function id() {
  return crypto.randomUUID();
}

export function amount(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 && n <= 100000000 ? n.toFixed(2) : null;
}

export async function userOr401(req: any, res: any) {
  const user = await findUserBySession(req);
  if (!user) {
    fail(res, 401, "Not authenticated");
    return null;
  }
  return user;
}

export function adminOr401(req: any, res: any) {
  try {
    const session = readSession(req);
    if (!session) {
      fail(res, 401, "Not authenticated");
      return null;
    }
    return session;
  } catch {
    fail(res, 503, "Admin authentication is not configured");
    return null;
  }
}

export async function userCollections(userId: string) {
  await ensureDatabase();
  const [transactions, deposits, withdrawals, kyc] = await Promise.all([
    db.select().from(transactionsTable).where(eq(transactionsTable.userId, userId)).orderBy(desc(transactionsTable.createdAt)),
    db.select().from(depositsTable).where(eq(depositsTable.userId, userId)).orderBy(desc(depositsTable.createdAt)),
    db.select().from(withdrawalsTable).where(eq(withdrawalsTable.userId, userId)).orderBy(desc(withdrawalsTable.createdAt)),
    db.select().from(kycRequestsTable).where(eq(kycRequestsTable.userId, userId)).orderBy(desc(kycRequestsTable.createdAt)),
  ]);
  return { transactions, deposits, withdrawals, kyc };
}

export {
  and,
  db,
  depositsTable,
  ensureDatabase,
  kycRequestsTable,
  publicUser,
  siteSettingsTable,
  transactionsTable,
  usersTable,
  withdrawalsTable,
};