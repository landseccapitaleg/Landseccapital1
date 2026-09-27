// @ts-nocheck
import { body, fail, id, amount, db, depositsTable, transactionsTable, userOr401, userCollections, publicUser } from "../_json";
export default async function handler(req: any, res: any) {
  if (!["GET", "POST"].includes(req.method)) return fail(res, 405, "Method not allowed");
  try {
    const user = await userOr401(req, res); if (!user) return;
    if (req.method === "GET") return res.status(200).json({ deposits: (await userCollections(user.id)).deposits });
    const b = body(req), value = amount(b.amount), method = String(b.method || "").trim(), ref = String(b.txRef || "").trim();
    if (!value || !method || !ref || method.length > 40 || ref.length > 255) return fail(res, 400, "Valid amount, method, and txRef are required");
    const [deposit] = await db.insert(depositsTable).values({ id: id(), userId: user.id, amount: value, method, reference: ref, currency: "USD", note: JSON.stringify({ asset: String(b.asset || ""), network: String(b.network || "") }) }).returning();
    await db.insert(transactionsTable).values({ id: id(), userId: user.id, type: "deposit", amount: value, reference: deposit.id, status: "pending" });
    return res.status(201).json({ deposit, user: publicUser(user) });
  } catch { fail(res, 503, "Database unavailable"); }
}