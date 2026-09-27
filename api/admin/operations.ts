// @ts-nocheck
import { body, fail, id, adminOr401, db, depositsTable, withdrawalsTable, kycRequestsTable, siteSettingsTable, usersTable, transactionsTable, publicUser, and } from "../_json";
import { desc, eq, sql } from "drizzle-orm";

function exposed(row: any, user: any) {
  return { ...row, userName: user?.name || "", userEmail: user?.email || "" };
}
async function collections() {
  const [users, deposits, withdrawals, kyc, settings] = await Promise.all([
    db.select().from(usersTable).orderBy(desc(usersTable.createdAt)),
    db.select().from(depositsTable).orderBy(desc(depositsTable.createdAt)),
    db.select().from(withdrawalsTable).orderBy(desc(withdrawalsTable.createdAt)),
    db.select().from(kycRequestsTable).orderBy(desc(kycRequestsTable.createdAt)),
    db.select().from(siteSettingsTable),
  ]);
  const byId = new Map(users.map((u) => [u.id, u]));
  const paymentDetails = settings.find((s) => s.key === "paymentDetails")?.value || {};
  const homepageContent = settings.find((s) => s.key === "homepageContent")?.value || {};
  return { users: users.map(publicUser), deposits: deposits.map((x) => exposed(x, byId.get(x.userId))), withdrawals: withdrawals.map((x) => exposed(x, byId.get(x.userId))), kycRequests: kyc.map((x) => exposed(x, byId.get(x.userId))), paymentDetails, homepageContent };
}
export default async function handler(req: any, res: any) {
  if (!["GET", "POST"].includes(req.method)) return fail(res, 405, "Method not allowed");
  const admin = adminOr401(req, res); if (!admin) return;
  try {
    if (req.method === "GET") return res.status(200).json(await collections());
    const b = body(req), action = String(b.action || ""), [kind, operation] = action.split(".");
    const table = kind === "deposit" ? depositsTable : kind === "withdrawal" ? withdrawalsTable : kind === "kyc" ? kycRequestsTable : null;
    if (table && ["approve", "reject"].includes(operation)) {
      if (typeof b.id !== "string" || !b.id || operation === "reject" && (typeof b.reason !== "string" || !b.reason.trim())) return fail(res, 400, "id and rejection reason are required");
      const result = await db.transaction(async (tx) => {
        // Only a pending request can transition. This makes retries (and even
        // conflicting retries) harmless and ensures balance changes happen once.
        const patch: any = { status: operation === "approve" ? "approved" : "rejected", reviewedBy: admin.email, reviewedAt: new Date(), updatedAt: new Date() };
        if (kind === "kyc" && operation === "reject") patch.rejectionReason = b.reason.trim().slice(0, 1000);
        const [updated] = await tx.update(table).set(patch).where(and(eq(table.id, b.id), eq(table.status, "pending"))).returning();
        if (!updated) return { found: !!(await tx.select({ id: table.id }).from(table).where(eq(table.id, b.id)).limit(1))[0], changed: false };
        if (kind === "deposit" && operation === "approve") {
          await tx.update(usersTable).set({ investedAmount: sql`${usersTable.investedAmount} + ${updated.amount}` }).where(eq(usersTable.id, updated.userId));
        } else if (kind === "withdrawal" && operation === "reject") {
          // The withdrawal endpoint reserved this amount. Refund exactly on
          // the pending -> rejected transition above.
          await tx.update(usersTable).set({ withdrawableProfit: sql`${usersTable.withdrawableProfit} + ${updated.amount}` }).where(eq(usersTable.id, updated.userId));
        }
        if (kind !== "kyc") await tx.update(transactionsTable).set({ status: patch.status }).where(eq(transactionsTable.reference, b.id));
        return { found: true, changed: true };
      });
      if (!result.found) return fail(res, 404, "Operation not found");
      return res.status(200).json({ ok: true, ...await collections() });
    }
    if (action === "settings.payment" || action === "settings.homepage") {
      if (!b.data || typeof b.data !== "object" || Array.isArray(b.data)) return fail(res, 400, "data object is required");
      const key = action === "settings.payment" ? "paymentDetails" : "homepageContent";
      await db.insert(siteSettingsTable).values({ key, value: b.data, updatedBy: admin.email, updatedAt: new Date() }).onConflictDoUpdate({ target: siteSettingsTable.key, set: { value: b.data, updatedBy: admin.email, updatedAt: new Date() } });
      return res.status(200).json({ ok: true, ...await collections() });
    }
    return fail(res, 400, "Unsupported action");
  } catch { fail(res, 503, "Database unavailable"); }
}