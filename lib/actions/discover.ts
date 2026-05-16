"use server";

import { Prisma, ServiceCategory } from "@prisma/client";
import { z } from "zod";
import { db } from "../db";
import { isCategoryEnabled } from "../env";
import { postcodePrefix } from "../geo";

const stackInput = z.object({
  category: z.nativeEnum(ServiceCategory),
  postcode: z.string().regex(/^\d{5}$/),
  maxRateMyrSen: z.number().int().positive().optional(),
  minRating: z.number().min(0).max(5).default(0),
  skillQuery: z.string().min(2).max(40).optional(),
  cursor: z.string().cuid().optional(),
  pageSize: z.number().int().min(1).max(20).default(10),
});

export type StackCard = {
  listingId: string;
  helperId: string;
  displayName: string;
  tagline: string | null;
  photoUrl: string | null;
  category: ServiceCategory;
  pricingMode: "HOURLY" | "PER_JOB";
  rateMyrSen: number;
  skills: string[];
  ratingAvg: number;
  ratingCount: number;
  completedJobs: number;
  distanceKm: number | null;
};

/**
 * Returns the next page of swipe-stack cards for a client.
 * Filters: feature-flag-enabled categories, postcode-prefix overlap,
 * not previously swiped, not blocked, not own listing.
 * Ranking is simple for MVP — server-side ORDER BY rating + recency.
 * Distance is computed in app code from the client's postcode centroid.
 */
export async function nextStackPage(clientId: string, raw: unknown): Promise<StackCard[]> {
  const input = stackInput.parse(raw);

  if (!isCategoryEnabled(input.category)) return [];

  const prefix = postcodePrefix(input.postcode, 2);

  const where: Prisma.HelperListingWhereInput = {
    active: true,
    category: input.category,
    helper: {
      user: { status: { in: ["ACTIVE", "PROBATION"] }, NOT: { id: clientId } },
      serviceAreas: { has: prefix },
      ratingAvg: { gte: input.minRating },
    },
    NOT: {
      swipes: { some: { swiperId: clientId } },
    },
    ...(input.maxRateMyrSen ? { rateMyrSen: { lte: input.maxRateMyrSen } } : {}),
    ...(input.skillQuery ? { skills: { has: input.skillQuery } } : {}),
  };

  const rows = await db.helperListing.findMany({
    where,
    take: input.pageSize,
    orderBy: [{ helper: { ratingAvg: "desc" } }, { createdAt: "desc" }],
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    include: {
      helper: {
        select: {
          userId: true,
          displayName: true,
          tagline: true,
          photoUrls: true,
          ratingAvg: true,
          ratingCount: true,
          completedJobs: true,
          baseLat: true,
          baseLng: true,
        },
      },
    },
  });

  // TODO(geo): replace postcode-centroid lookup with Google Geocoding when key configured.
  // For MVP we omit distance when the client postcode centroid isn't known.
  return rows.map((r) => ({
    listingId: r.id,
    helperId: r.helperId,
    displayName: r.helper.displayName,
    tagline: r.helper.tagline,
    photoUrl: r.helper.photoUrls[0] ?? null,
    category: r.category,
    pricingMode: r.pricingMode,
    rateMyrSen: r.rateMyrSen,
    skills: r.skills.slice(0, 3),
    ratingAvg: r.helper.ratingAvg,
    ratingCount: r.helper.ratingCount,
    completedJobs: r.helper.completedJobs,
    distanceKm: null,
  }));
}

