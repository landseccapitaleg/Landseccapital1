// @ts-nocheck
import { readSession } from "../../lib/vercel/admin-auth";

export default function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    if (!readSession(req)) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
  } catch {
    res.status(503).json({ error: "Admin authentication is not configured" });
    return;
  }

  res.status(409).json({
    error: "Password changes must be made by updating the ADMIN_PASSWORD deployment secret.",
  });
}