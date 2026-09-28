// @ts-nocheck
import { body, fail, id, db, kycRequestsTable, userOr401, userCollections } from "../../lib/vercel/json";
export default async function handler(req: any, res: any) {
  if (!["GET", "POST"].includes(req.method)) return fail(res, 405, "Method not allowed");
  try {
    const user = await userOr401(req, res); if (!user) return;
    if (req.method === "GET") return res.status(200).json({ kyc: (await userCollections(user.id)).kyc });
    const b = body(req), docs = b.documents;
    const types = ["idFront", "idBack", "address", "selfie"];
    if (!b.dob || !b.nationality || !b.phone || !b.documentType || !docs || typeof docs !== "object" || types.some((k) => typeof docs[k] !== "string" || !docs[k].trim())) return fail(res, 400, "All KYC fields and documents are required");
    const [kyc] = await db.insert(kycRequestsTable).values({ id: id(), userId: user.id, documentType: String(b.documentType).slice(0, 80), dob: String(b.dob).slice(0, 30), nationality: String(b.nationality).slice(0, 100), phone: String(b.phone).slice(0, 40), documents: docs }).returning();
    return res.status(201).json({ kyc });
  } catch { fail(res, 503, "Database unavailable"); }
}