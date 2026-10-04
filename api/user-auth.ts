// @ts-nocheck
import crypto from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const PLAN_TERM_DAYS: Record<string, number> = {
  "Foundation Plan": 365,
  "Growth Plan": 730,
  "Premier Plan": 1095,
  "Prestige Plan": 1095,
  "Institutional Plan": 1460,
  "Heritage Plan": 1460,
};

const nativeImport = new Function("specifier", "return import(specifier)") as (
  specifier: string,
) => Promise<any>;

function importDatabaseModule(name: "index" | "user-auth") {
  const extension = process.env.VERCEL ? "js" : "ts";
  const modulePath = resolve(__dirname, `../lib/db/src/${name}.${extension}`);
  return nativeImport(pathToFileURL(modulePath).href);
}

function readRoute(req: any) {
  const queryRoute = req.query?.route;
  if (queryRoute) return String(queryRoute);
  const path = String(req.url || "").split("?")[0];
  return path.endsWith("/healthz") ? "health" : path.split("/").pop() || "";
}

function maturityDate(start: string, plan: string) {
  const date = new Date(start);
  date.setDate(date.getDate() + (PLAN_TERM_DAYS[plan] || 365));
  return date.toISOString();
}

function databaseFailureCode(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  if (/ERR_MODULE_NOT_FOUND|Cannot find (?:module|package)/i.test(message)) {
    return "database_module_missing";
  }
  if (/invalid (?:postgresql? )?connection string|invalid url/i.test(message)) {
    return "database_url_invalid";
  }
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH|password authentication failed|no pg_hba\.conf/i.test(message)) {
    return "database_connection_failed";
  }
  return "database_initialization_failed";
}

export default async function handler(req: any, res: any) {
  const route = readRoute(req);

  if (route === "health") {
    try {
      const { ensureDatabase } = await importDatabaseModule("index");
      await ensureDatabase();
      res.status(200).json({ status: "ok", database: "ready" });
    } catch (error) {
      console.error("Health check database initialization failed", error);
      res.status(503).json({
        status: "error",
        database: "unavailable",
        code: databaseFailureCode(error),
      });
    }
    return;
  }

  if (route === "logout") {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    res.setHeader("Set-Cookie", "landsec_user_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax");
    res.status(200).json({ ok: true });
    return;
  }

  if (route === "session") {
    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    try {
      const { findUserBySession, publicUser } = await importDatabaseModule("user-auth");
      const user = await findUserBySession(req);
      if (!user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }
      res.status(200).json({ user: publicUser(user) });
    } catch (error: any) {
      console.error("User session lookup failed", error);
      res.status(503).json({ error: "User authentication is not configured" });
    }
    return;
  }

  if (route === "login") {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const { findUserByEmail, verifyPassword, createUserSession, publicUser, setUserSessionCookie } =
        await importDatabaseModule("user-auth");
      const user = await findUserByEmail(email);
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
      setUserSessionCookie(res, createUserSession(user.id));
      res.status(200).json({ user: publicUser(user) });
    } catch (error: any) {
      console.error("User login failed", error);
      res.status(503).json({ error: "User authentication is not configured" });
    }
    return;
  }

  if (route === "register") {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const name = String(body.name || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const plan = String(body.plan || "Foundation Plan");
      if (!name || !email || !password) {
        res.status(400).json({ error: "Name, email, and password are required" });
        return;
      }
      if (password.length < 8) {
        res.status(400).json({ error: "Password must be at least 8 characters" });
        return;
      }
      const {
        findUserByEmail,
        hashPassword,
        createUserSession,
        publicUser,
        setUserSessionCookie,
        db,
        usersTable,
      } = await importDatabaseModule("user-auth");
      if (await findUserByEmail(email)) {
        res.status(409).json({ error: "An account with this email already exists" });
        return;
      }

      const now = new Date().toISOString();
      const user = {
        id: crypto.randomUUID(),
        name,
        email,
        passwordHash: await hashPassword(password),
        country: String(body.country || ""),
        phone: String(body.phone || ""),
        plan,
        investedAmount: "0",
        withdrawableProfit: "0",
        totalReturns: "0",
        investmentStartDate: now,
        maturityDate: maturityDate(now, plan),
        joinDate: now,
        lastProfitAt: Date.now(),
      };
      const [created] = await db.insert(usersTable).values(user).returning();
      setUserSessionCookie(res, createUserSession(created.id));
      res.status(201).json({ user: publicUser(created) });
    } catch (error: any) {
      console.error("User registration failed", error);
      res.status(503).json({ error: "User authentication is not configured" });
    }
    return;
  }

  res.status(404).json({ error: "Route not found" });
}