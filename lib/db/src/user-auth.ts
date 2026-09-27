import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db, ensureDatabase } from "./index";
import { usersTable, type UserRecord } from "./schema";

export const USER_COOKIE_NAME = "landsec_user_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export async function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(key));
  });
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [, salt, expected] = storedHash.split(":");
  if (!salt || !expected) return false;
  const actual = await hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(storedHash));
}

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  return secret;
}

function sign(value: string) {
  return crypto.createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export function createUserSession(userId: string) {
  const payload = Buffer.from(JSON.stringify({
    userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readUserSession(req: any) {
  const cookieHeader = req.headers?.cookie || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((part: string) => part.trim().split("="))
      .filter(([key, value]: string[]) => key && value)
      .map(([key, ...value]: string[]) => [key, value.join("=")]),
  );
  const token = cookies[USER_COOKIE_NAME];
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return session.exp > Math.floor(Date.now() / 1000) ? session : null;
  } catch {
    return null;
  }
}

export function setUserSessionCookie(res: any, token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${USER_COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_SECONDS}; SameSite=Lax${secure}`);
}

export function clearUserSessionCookie(res: any) {
  res.setHeader("Set-Cookie", `${USER_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
}

export async function findUserByEmail(email: string) {
  await ensureDatabase();
  const rows = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  return rows[0] || null;
}

export async function findUserBySession(req: any) {
  await ensureDatabase();
  const session = readUserSession(req);
  if (!session?.userId) return null;
  const rows = await db.select().from(usersTable).where(eq(usersTable.id, session.userId)).limit(1);
  return rows[0] || null;
}

export function publicUser(user: UserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    investedAmount: Number(user.investedAmount),
    withdrawableProfit: Number(user.withdrawableProfit),
    totalReturns: Number(user.totalReturns),
    investmentStartDate: user.investmentStartDate,
    maturityDate: user.maturityDate,
    joinDate: user.joinDate,
    lastProfitAt: user.lastProfitAt,
  };
}

export { db, usersTable };