// @ts-nocheck
import { createSession, setSessionCookie, verifyCredentials } from "../../lib/vercel/admin-auth";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    if (!verifyCredentials(body.email, body.password)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    setSessionCookie(res, createSession(body.email));
    res.status(200).json({
      admin: { email: body.email, name: "Super Admin", role: "super" },
    });
  } catch {
    res.status(503).json({ error: "Admin authentication is not configured" });
  }
}