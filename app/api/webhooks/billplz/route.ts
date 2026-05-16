import { NextRequest, NextResponse } from "next/server";
import { verifyXSignature } from "@/lib/billplz";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const payload: Record<string, string> = {};
  for (const [k, v] of formData.entries()) payload[k] = String(v);

  const signature = payload.x_signature;
  if (!signature || !verifyXSignature(payload, signature)) {
    return NextResponse.json({ ok: false, error: "bad signature" }, { status: 400 });
  }

  const billId = payload.id;
  const paid = payload.paid === "true";

  const intent = await db.paymentIntent.findUnique({
    where: { providerBillId: billId },
    select: { id: true, status: true },
  });
  if (!intent) {
    // Idempotent: log and 200 so Billplz doesn't keep retrying for unknown bills.
    return NextResponse.json({ ok: true, unknownBill: true });
  }

  if (paid && intent.status === "PENDING") {
    await db.paymentIntent.update({
      where: { id: intent.id },
      data: { status: "AUTHORIZED", authorizedAt: new Date(), rawWebhook: payload },
    });
  }

  return NextResponse.json({ ok: true });
}
