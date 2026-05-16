"use server";

import { SwipeDirection } from "@prisma/client";
import { respondToInterest } from "@/lib/actions/swipe";
import { getSessionUserId } from "@/lib/session";

export async function respondInterestAction(
  clientId: string,
  listingId: string,
  direction: "LEFT" | "RIGHT",
) {
  const uid = await getSessionUserId();
  if (!uid) return { ok: false as const, error: "Not authenticated" };
  return respondToInterest(uid, clientId, listingId, direction as SwipeDirection);
}
