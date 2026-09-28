// @ts-nocheck
import { getAdminEmail, readSession } from "../../lib/vercel/admin-auth";

export default function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const session = readSession(req);
    if (!session) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    res.status(200).json({
      admin: { email: getAdminEmail(), name: "Super Admin", role: "super" },
    });
  } catch {
    res.status(503).json({ error: "Admin authentication is not configured" });
  }
}