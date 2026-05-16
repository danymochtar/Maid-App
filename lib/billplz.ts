import { createHmac, timingSafeEqual } from "node:crypto";
import { env, requireEnv } from "./env";

const BASE = env.BILLPLZ_API_BASE;

function authHeader() {
  const key = requireEnv("BILLPLZ_API_KEY");
  const token = Buffer.from(`${key}:`).toString("base64");
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
  const collectionId = requireEnv("BILLPLZ_COLLECTION_ID");
  const body = new URLSearchParams({
    collection_id: collectionId,
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
  const secret = requireEnv("BILLPLZ_X_SIGNATURE");
  const source = Object.keys(payload)
    .filter((k) => k !== "x_signature")
    .sort()
    .map((k) => `${k}${payload[k]}`)
    .join("|");
  const expected = createHmac("sha256", secret).update(source).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
