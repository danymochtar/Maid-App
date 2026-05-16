import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CATEGORY_META } from "@/lib/categories";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { BookingActions } from "./booking-actions";

export const dynamic = "force-dynamic";

export default async function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getSessionUser();
  if (!me) redirect("/login");

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      helper: { select: { id: true, helperProfile: { select: { displayName: true, tagline: true } } } },
      client: { select: { id: true, clientProfile: { select: { fullName: true } } } },
      address: true,
      payment: true,
    },
  });
  if (!booking) notFound();
  if (booking.clientId !== me.id && booking.helperId !== me.id) notFound();

  const meta = CATEGORY_META[booking.category];
  const other = me.role === "HELPER"
    ? booking.client.clientProfile?.fullName ?? "Client"
    : booking.helper.helperProfile?.displayName ?? "Helper";

  return (
    <main className="mx-auto max-w-md p-4">
      <Link href="/bookings" className="text-sm text-zinc-500">
        ← Back
      </Link>
      <h1 className="mt-4 text-2xl font-bold">
        {meta.emoji} {meta.label}
      </h1>
      <p className="text-zinc-500">with {other}</p>

      <section className="mt-6 space-y-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <Row label="Status" value={booking.status} />
        <Row
          label="Scheduled"
          value={booking.scheduledStart.toLocaleString("en-MY", {
            dateStyle: "full",
            timeStyle: "short",
          })}
        />
        {booking.durationHours && <Row label="Duration" value={`${booking.durationHours} hours`} />}
        <Row
          label="Address"
          value={`${booking.address.line1}, ${booking.address.postcode} ${booking.address.city}`}
        />
        <Row
          label="Pricing"
          value={`RM${booking.rateMyrSenSnap / 100}/${booking.pricingMode === "HOURLY" ? "hr" : "job"}`}
        />
        <Row label="Estimated total" value={`RM${(booking.estTotalMyrSen / 100).toFixed(2)}`} />
        {booking.payment && (
          <>
            <Row label="Payment" value={booking.payment.status} />
            {booking.payment.payoutHoldUntil && (
              <Row
                label="Payout held until"
                value={booking.payment.payoutHoldUntil.toLocaleString("en-MY")}
              />
            )}
          </>
        )}
      </section>

      <BookingActions
        bookingId={booking.id}
        status={booking.status}
        viewerRole={me.role}
        paymentStatus={booking.payment?.status ?? null}
      />

      <Link
        href={`/matches/${booking.matchId}`}
        className="mt-6 block rounded-full border border-zinc-200 bg-white py-3 text-center text-sm font-semibold"
      >
        Open chat with {other}
      </Link>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}
