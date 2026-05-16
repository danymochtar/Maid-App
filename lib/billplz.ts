import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";

const BASE = env.BILLPLZ_API_BASE;

function authHeader() {
  if (!env.BILLPLZ_API_KEY) throw new Error("BILLPLZ_API_KEY not set");
  const token = Buffer.from(`${env.BILLPLZ_API_KEY}:`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

export type CreateBillInput = {
  email?: string;
  mobile?: string;
  name: string;
  amountCents: number;
  description: string;
  callbackUrl: string;
  redirectUrl: string;
  reference1Label?: string;
  reference1?: string;
};

export async function createBill(input: CreateBillInput) {
  if (!env.BILLPLZ_COLLECTION_ID) throw new Error("BILLPLZ_COLLECTION_ID not set");
  const body = new URLSearchParams({
    collection_id: env.BILLPLZ_COLLECTION_ID,
    description: input.description,
    name: input.name,
    amount: String(input.amountCents),
    callback_url: input.callbackUrl,
    redirect_url: input.redirectUrl,
    ...(input.email ? { email: input.email } : {}),
    ...(input.mobile ? { mobile: input.mobile } : {}),
    ...(input.reference1Label ? { reference_1_label: input.reference1Label } : {}),
    ...(input.reference1 ? { reference_1: input.reference1 } : {}),
  });

  const res = await fetch(`${BASE}/bills`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Billplz createBill failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as { id: string; url: string; state: string };
}

export async function getBill(billId: string) {
  const res = await fetch(`${BASE}/bills/${billId}`, { headers: authHeader() });
  if (!res.ok) throw new Error(`Billplz getBill failed: ${res.status}`);
  return res.json();
}

// X-Signature for webhook: HMAC-SHA256 of sorted key-value pairs separated by `|`.
// See https://www.billplz.com/api#callback-xsignature
export function verifyXSignature(payload: Record<string, string>, signature: string): boolean {
  if (!env.BILLPLZ_X_SIGNATURE) throw new Error("BILLPLZ_X_SIGNATURE not set");
  const source = Object.keys(payload)
    .filter((k) => k !== "x_signature")
    .sort()
    .map((k) => `${k}${payload[k]}`)
    .join("|");
  const expected = createHmac("sha256", env.BILLPLZ_X_SIGNATURE).update(source).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
