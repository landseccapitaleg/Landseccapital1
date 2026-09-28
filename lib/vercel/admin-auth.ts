// @ts-nocheck
import crypto from "node:crypto";

const COOKIE_NAME = "landsec_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getConfig() {
  const email = process.env.ADMIN_EMAIL || "landseccapital@gmail.com";
  const password = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!email || !password || !sessionSecret) {
    throw new Error("Admin authentication is not configured");
  }

  return { email, password, sessionSecret };
}

function sign(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSession(email: string) {
  const { sessionSecret } = getConfig();
  const payload = Buffer.from(
    JSON.stringify({
      email,
      role: "super",
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    }),
  ).toString("base64url");

  return `${payload}.${sign(payload, sessionSecret)}`;
}

export function readSession(req: any) {
  const { sessionSecret } = getConfig();
  const cookieHeader = req.headers?.cookie || "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part: string) => part.trim().split("="))
      .filter(([key, value]: string[]) => key && value)
      .map(([key, ...value]: string[]) => [key, value.join("=")]),
  );
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || sign(payload, sessionSecret) !== signature) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!session.email || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: any, token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_SECONDS}; SameSite=Lax${secure}`,
  );
}

export function clearSessionCookie(res: any) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
}

export function verifyCredentials(email: unknown, password: unknown) {
  const config = getConfig();
  return email === config.email && password === config.password;
}

export function getAdminEmail() {
  return getConfig().email;
}