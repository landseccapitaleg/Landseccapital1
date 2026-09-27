// @ts-nocheck
import { ensureDatabase } from "../lib/db/src";

export default async function handler(_req: any, res: any) {
  try {
    await ensureDatabase();
    res.status(200).json({ status: "ok", database: "ready" });
  } catch (error) {
    console.error("Health check database initialization failed", error);
    res.status(503).json({ status: "error", database: "unavailable" });
  }
}
