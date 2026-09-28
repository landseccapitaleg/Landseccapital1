// @ts-nocheck
import { body, fail, id, amount, db, withdrawalsTable, transactionsTable, userOr401, userCollections, publicUser, usersTable } from "../../lib/vercel/json";
import { and, eq, sql } from "drizzle-orm";
export default async function handler(req: any, res: any) {
  if (!["GET", "POST"].includes(req.method)) return fail(res, 405, "Method not allowed");
  try {
    const user = await userOr401(req, res); if (!user) return;
    if (req.method === "GET") return res.status(200).json({ withdrawals: (await userCollections(user.id)).withdrawals });
    const b = body(req), value = amount(b.amount), method = String(b.method || "").trim(), destination = String(b.destination || "").trim();
    if (!value || !method || !destination || method.length > 40 || destination.length > 500) return fail(res, 400, "Valid amount, method, and destination are required");
    const result = await db.transaction(async (tx) => {
      // The conditional update is the reservation: concurrent requests cannot
      // spend the same withdrawable balance.
      const [reserved] = await tx.update(usersTable)
        .set({ withdrawableProfit: sql`${usersTable.withdrawableProfit} - ${value}` })
        .where(and(eq(usersTable.id, user.id), sql`${usersTable.withdrawableProfit} >= ${value}`))
        .returning();
      if (!reserved) return null;
      const [withdrawal] = await tx.insert(withdrawalsTable).values({ id: id(), userId: user.id, amount: value, method, destination }).returning();
      await tx.insert(transactionsTable).values({ id: id(), userId: user.id, type: "withdrawal", amount: value, reference: withdrawal.id, status: "pending" });
      return { withdrawal, user: reserved };
    });
    if (!result) return fail(res, 400, "Insufficient withdrawable balance");
    return res.status(201).json({ withdrawal: result.withdrawal, user: publicUser(result.user) });
  } catch { fail(res, 503, "Database unavailable"); }
}