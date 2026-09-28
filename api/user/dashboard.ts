// @ts-nocheck
import { userCollections, userOr401, fail, publicUser } from "../../lib/vercel/json";
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return fail(res, 405, "Method not allowed");
  try { const user = await userOr401(req, res); if (!user) return; res.status(200).json({ user: publicUser(user), ...await userCollections(user.id) }); }
  catch { fail(res, 503, "Database unavailable"); }
}