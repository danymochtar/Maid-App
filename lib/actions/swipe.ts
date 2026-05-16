"use server";

import { MatchStatus, SwipeDirection } from "@prisma/client";
import { z } from "zod";
import { db } from "../db";
import { rateLimit } from "../rate-limit";

const swipeInput = z.object({
  targetListingId: z.string().cuid(),
  direction: z.nativeEnum(SwipeDirection),
  searchCtx: z
    .object({
      postcode: z.string().optional(),
      dateTime: z.string().optional(),
    })
    .optional(),
  note: z.string().max(140).optional(),
});

const MATCH_TTL_DAYS = 7;

export type SwipeResult =
  | { ok: true; matched: false }
  | { ok: true; matched: true; matchId: string }
  | { ok: false; error: string };

/**
 * Client swipes on a HelperListing. Idempotent on (swiperId, targetListingId).
 * On RIGHT/SUPER, upserts a PENDING Match. If the helper has already right-swiped
 * this client on this listing, the Match flips to MATCHED and chat unlocks.
 */
export async function swipeListing(
  clientId: string,
  input: z.infer<typeof swipeInput>,
): Promise<SwipeResult> {
  const parsed = swipeInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.message };

  // Rate limits: 100 swipes/client/day, 20 right-swipes/client/day.
  const all = await rateLimit(`swipe:all:${clientId}`, 100, 86400);
  if (!all.allowed) return { ok: false, error: "Daily swipe limit reached" };
  if (parsed.data.direction !== "LEFT") {
    const right = await rateLimit(`swipe:right:${clientId}`, 20, 86400);
    if (!right.allowed) return { ok: false, error: "Daily interest limit reached" };
  }

  const listing = await db.helperListing.findUnique({
    where: { id: parsed.data.targetListingId },
    select: { id: true, helperId: true, active: true },
  });
  if (!listing || !listing.active) return { ok: false, error: "Listing unavailable" };
  if (listing.helperId === clientId) return { ok: false, error: "Cannot swipe own listing" };

  return db.$transaction(async (tx) => {
    await tx.swipe.upsert({
      where: {
        swiperId_targetListingId: {
          swiperId: clientId,
          targetListingId: listing.id,
        },
      },
      create: {
        swiperId: clientId,
        swiperRole: "CLIENT",
        direction: parsed.data.direction,
        targetListingId: listing.id,
        searchCtx: parsed.data.searchCtx,
        note: parsed.data.note,
      },
      update: { direction: parsed.data.direction, note: parsed.data.note },
    });

    if (parsed.data.direction === "LEFT") {
      return { ok: true, matched: false } satisfies SwipeResult;
    }

    const match = await tx.match.upsert({
      where: {
        clientId_helperId_listingId: {
          clientId,
          helperId: listing.helperId,
          listingId: listing.id,
        },
      },
      create: {
        clientId,
        helperId: listing.helperId,
        listingId: listing.id,
        status: MatchStatus.PENDING,
        expiresAt: new Date(Date.now() + MATCH_TTL_DAYS * 86400_000),
      },
      update: {},
    });

    // Has the helper already right-swiped the client on this listing?
    const reverse = await tx.swipe.findFirst({
      where: {
        swiperId: listing.helperId,
        targetClientId: clientId,
        direction: { in: ["RIGHT", "SUPER"] },
      },
      select: { id: true },
    });

    if (reverse && match.status === MatchStatus.PENDING) {
      const updated = await tx.match.update({
        where: { id: match.id },
        data: { status: MatchStatus.MATCHED, matchedAt: new Date() },
      });
      return { ok: true, matched: true, matchId: updated.id } satisfies SwipeResult;
    }

    return { ok: true, matched: false } satisfies SwipeResult;
  });
}

/**
 * Helper accepts/declines an incoming client interest from their inbox.
 */
export async function respondToInterest(
  helperId: string,
  clientId: string,
  listingId: string,
  direction: SwipeDirection,
): Promise<SwipeResult> {
  const listing = await db.helperListing.findUnique({
    where: { id: listingId },
    select: { helperId: true },
  });
  if (!listing || listing.helperId !== helperId) {
    return { ok: false, error: "Not your listing" };
  }

  return db.$transaction(async (tx) => {
    await tx.swipe.upsert({
      where: {
        swiperId_targetClientId: { swiperId: helperId, targetClientId: clientId },
      },
      create: {
        swiperId: helperId,
        swiperRole: "HELPER",
        direction,
        targetClientId: clientId,
      },
      update: { direction },
    });

    const match = await tx.match.findUnique({
      where: { clientId_helperId_listingId: { clientId, helperId, listingId } },
    });
    if (!match) return { ok: true, matched: false } satisfies SwipeResult;

    if (direction === "LEFT") {
      await tx.match.update({
        where: { id: match.id },
        data: { status: MatchStatus.EXPIRED },
      });
      return { ok: true, matched: false } satisfies SwipeResult;
    }

    const updated = await tx.match.update({
      where: { id: match.id },
      data: { status: MatchStatus.MATCHED, matchedAt: new Date() },
    });
    return { ok: true, matched: true, matchId: updated.id } satisfies SwipeResult;
  });
}
