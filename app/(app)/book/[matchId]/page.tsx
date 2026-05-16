import { notFound, redirect } from "next/navigation";
import { CATEGORY_META } from "@/lib/categories";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { BookingForm } from "./booking-form";

export const dynamic = "force-dynamic";

export default async function BookPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (me.role !== "CLIENT") redirect("/discover");

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      helper: { select: { helperProfile: { select: { displayName: true } } } },
      listing: true,
    },
  });
  if (!match || match.clientId !== me.id) notFound();
  if (match.status !== "MATCHED") redirect(`/matches/${matchId}`);

  const addresses = await db.address.findMany({
    where: { clientId: me.id },
    orderBy: { createdAt: "desc" },
  });
  if (addresses.length === 0) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <p>You don't have a saved address yet. Address management ships next.</p>
      </main>
    );
  }

  const meta = CATEGORY_META[match.listing.category];

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold">Book {match.helper.helperProfile?.displayName}</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {meta.emoji} {meta.label} · RM{match.listing.rateMyrSen / 100}/
        {match.listing.pricingMode === "HOURLY" ? "hr" : "job"}
      </p>

      <BookingForm
        matchId={match.id}
        pricingMode={match.listing.pricingMode}
        rateMyrSen={match.listing.rateMyrSen}
        addresses={addresses.map((a) => ({
          id: a.id,
          label: `${a.line1}, ${a.postcode} ${a.city}`,
        }))}
      />
    </main>
  );
}
