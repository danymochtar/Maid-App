"use server";

import { SwipeDirection } from "@prisma/client";
import { nextStackPage } from "@/lib/actions/discover";
import { swipeListing } from "@/lib/actions/swipe";
import type { StackFilters } from "@/components/swipe/filters-drawer";

import { TEST_CLIENT_ID } from "@/lib/dev-session";

export async function loadMoreAction(filters: StackFilters, cursor: string | null) {
  return nextStackPage(TEST_CLIENT_ID, { ...filters, cursor: cursor ?? undefined });
}

export async function swipeAction(listingId: string, direction: SwipeDirection) {
  return swipeListing(TEST_CLIENT_ID, { targetListingId: listingId, direction });
}
