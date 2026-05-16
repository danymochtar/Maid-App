"use server";

import { db } from "@/lib/db";
import { redactPii } from "@/lib/pii-redact";
import { rateLimit } from "@/lib/rate-limit";
import { getSessionUserId } from "@/lib/session";

export type SendResult =
  | { ok: true; id: string; body: string; redactedTypes: string[]; createdAt: string }
  | { ok: false; error: string };

export async function sendMessageAction(matchId: string, body: string): Promise<SendResult> {
  const uid = await getSessionUserId();
  if (!uid) return { ok: false, error: "Not authenticated" };

  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Message is empty" };
  if (trimmed.length > 1000) return { ok: false, error: "Message too long" };

  const rl = await rateLimit(`msg:${uid}`, 60, 60);
  if (!rl.allowed) return { ok: false, error: "Too many messages — slow down" };

  const match = await db.match.findUnique({
    where: { id: matchId },
    select: { clientId: true, helperId: true, status: true },
  });
  if (!match) return { ok: false, error: "Match not found" };
  if (match.clientId !== uid && match.helperId !== uid) return { ok: false, error: "Not your match" };
  if (match.status !== "MATCHED") return { ok: false, error: "Chat locked — not matched" };

  const { redacted, types } = redactPii(trimmed);

  const msg = await db.message.create({
    data: {
      matchId,
      senderId: uid,
      bodyRaw: trimmed,
      bodyRedacted: redacted,
      redactedPiiTypes: types,
    },
  });

  return {
    ok: true,
    id: msg.id,
    body: msg.bodyRedacted,
    redactedTypes: msg.redactedPiiTypes,
    createdAt: msg.createdAt.toISOString(),
  };
}
