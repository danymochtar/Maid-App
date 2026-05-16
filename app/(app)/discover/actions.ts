"use server";

import { SwipeDirection } from "@prisma/client";
import { nextStackPage } from "@/lib/actions/discover";
import { swipeListing } from "@/lib/actions/swipe";
import type { StackFilters } from "@/components/swipe/filters-drawer";

// TODO: replace with real session user once Better Auth is wired.
const DEMO_CLIENT_ID = "demo-client";

export async function loadMoreAction(filters: StackFilters, cursor: string | null) {
  return nextStackPage(DEMO_CLIENT_ID, { ...filters, cursor: cursor ?? undefined });
}

export async function swipeAction(listingId: string, direction: SwipeDirection) {
  return swipeListing(DEMO_CLIENT_ID, { targetListingId: listingId, direction });
}
