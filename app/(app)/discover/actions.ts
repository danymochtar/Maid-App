"use server";

import { SwipeDirection } from "@prisma/client";
import { redirect } from "next/navigation";
import type { StackFilters } from "@/components/swipe/filters-drawer";
import { nextStackPage } from "@/lib/actions/discover";
import { swipeListing } from "@/lib/actions/swipe";
import { getSessionUserId } from "@/lib/session";

async function requireUid(): Promise<string> {
  const id = await getSessionUserId();
  if (!id) redirect("/login");
  return id;
}

export async function loadMoreAction(filters: StackFilters, cursor: string | null) {
  const uid = await requireUid();
  return nextStackPage(uid, { ...filters, cursor: cursor ?? undefined });
}

export async function swipeAction(listingId: string, direction: SwipeDirection) {
  const uid = await requireUid();
  return swipeListing(uid, { targetListingId: listingId, direction });
}
