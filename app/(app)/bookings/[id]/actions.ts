"use server";

import { BookingStatus, PaymentStatus, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

type Result = { ok: true } | { ok: false; error: string };

export async function transitionBookingAction(
  bookingId: string,
  action: string,
): Promise<Result> {
  const me = await getSessionUser();
  if (!me) return { ok: false, error: "Not authenticated" };

  const b = await db.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!b) return { ok: false, error: "Booking not found" };
  if (b.clientId !== me.id && b.helperId !== me.id && me.role !== Role.ADMIN)
    return { ok: false, error: "Not your booking" };

  const isHelper = me.id === b.helperId;
  const isClient = me.id === b.clientId;

  switch (action) {
    case "accept": {
      if (!isHelper) return { ok: false, error: "Only helper can accept" };
      if (b.status !== BookingStatus.REQUESTED) return { ok: false, error: "Wrong status" };
      await db.booking.update({ where: { id: b.id }, data: { status: BookingStatus.ACCEPTED } });
      return { ok: true };
    }
    case "reject": {
      if (!isHelper) return { ok: false, error: "Only helper can reject" };
      await db.booking.update({ where: { id: b.id }, data: { status: BookingStatus.REJECTED } });
      return { ok: true };
    }
    case "checkin": {
      if (!isHelper) return { ok: false, error: "Only helper can check in" };
      if (b.status !== BookingStatus.ACCEPTED) return { ok: false, error: "Must be ACCEPTED first" };
      await db.booking.update({
        where: { id: b.id },
        data: { status: BookingStatus.CHECKED_IN, checkInAt: new Date() },
      });
      return { ok: true };
    }
    case "start": {
      if (!isHelper) return { ok: false, error: "Only helper can start" };
      await db.booking.update({
        where: { id: b.id },
        data: { status: BookingStatus.IN_PROGRESS },
      });
      return { ok: true };
    }
    case "complete": {
      if (!isHelper) return { ok: false, error: "Only helper can mark complete" };
      await db.booking.update({
        where: { id: b.id },
        data: { status: BookingStatus.COMPLETED, checkOutAt: new Date() },
      });
      return { ok: true };
    }
    case "cancel": {
      if (!isClient) return { ok: false, error: "Only client can cancel" };
      const cancellable: BookingStatus[] = [BookingStatus.REQUESTED, BookingStatus.ACCEPTED];
      if (!cancellable.includes(b.status)) return { ok: false, error: "Too late to cancel" };
      await db.booking.update({
        where: { id: b.id },
        data: { status: BookingStatus.CANCELLED, cancellationReason: "Client cancelled" },
      });
      if (b.payment && b.payment.status === PaymentStatus.AUTHORIZED) {
        await db.paymentIntent.update({
          where: { id: b.payment.id },
          data: { status: PaymentStatus.REFUNDED, refundedAt: new Date() },
        });
      }
      return { ok: true };
    }
    case "mock-pay": {
      if (!isClient) return { ok: false, error: "Only client can pay" };
      if (!b.payment) return { ok: false, error: "No payment intent" };
      await db.paymentIntent.update({
        where: { id: b.payment.id },
        data: { status: PaymentStatus.AUTHORIZED, authorizedAt: new Date() },
      });
      return { ok: true };
    }
    case "confirm-completion": {
      if (!isClient) return { ok: false, error: "Only client can confirm" };
      if (b.status !== BookingStatus.COMPLETED) return { ok: false, error: "Job not complete yet" };
      if (b.payment) {
        const holdUntil = new Date(Date.now() + 48 * 60 * 60 * 1000);
        await db.paymentIntent.update({
          where: { id: b.payment.id },
          data: {
            status: PaymentStatus.CAPTURED,
            capturedAt: new Date(),
            payoutHoldUntil: holdUntil,
          },
        });
      }
      return { ok: true };
    }
    default:
      return { ok: false, error: `Unknown action: ${action}` };
  }
}
