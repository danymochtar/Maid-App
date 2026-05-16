"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

const input = z.object({
  matchId: z.string().cuid(),
  scheduledStart: z.string().datetime(),
  durationHours: z.number().int().min(1).max(12).nullable(),
  addressId: z.string().cuid(),
});

export type CreateBookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: string };

export async function createBookingAction(raw: unknown): Promise<CreateBookingResult> {
  const uid = await getSessionUserId();
  if (!uid) return { ok: false, error: "Not authenticated" };

  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { matchId, scheduledStart, durationHours, addressId } = parsed.data;

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: { listing: true },
  });
  if (!match) return { ok: false, error: "Match not found" };
  if (match.clientId !== uid) return { ok: false, error: "Not your match" };
  if (match.status !== "MATCHED") return { ok: false, error: "Chat & booking locked until matched" };

  const address = await db.address.findUnique({ where: { id: addressId } });
  if (!address || address.clientId !== uid) return { ok: false, error: "Invalid address" };

  const when = new Date(scheduledStart);
  if (when.getTime() < Date.now() + 30 * 60_000)
    return { ok: false, error: "Booking must be at least 30 minutes in the future" };

  const rate = match.listing.rateMyrSen;
  const estTotal = match.listing.pricingMode === "HOURLY" ? rate * (durationHours ?? 0) : rate;

  const booking = await db.booking.create({
    data: {
      matchId: match.id,
      clientId: uid,
      helperId: match.helperId,
      listingId: match.listingId,
      category: match.listing.category,
      addressId: address.id,
      scheduledStart: when,
      durationHours: match.listing.pricingMode === "HOURLY" ? durationHours : null,
      fixedJob: match.listing.pricingMode === "PER_JOB",
      pricingMode: match.listing.pricingMode,
      rateMyrSenSnap: rate,
      estTotalMyrSen: estTotal,
      status: "REQUESTED",
      payment: {
        create: {
          provider: "BILLPLZ",
          amountMyrSen: estTotal,
          status: "PENDING",
        },
      },
    },
  });

  return { ok: true, bookingId: booking.id };
}
