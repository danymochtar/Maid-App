import { CATEGORY_META } from "@/lib/categories";
import { db } from "@/lib/db";
import { requireSessionUser } from "@/lib/session";
import { InterestCard } from "./interest-card";

export const dynamic = "force-dynamic";

export default async function HelperInbox() {
  const me = await requireSessionUser();

  // Pending matches addressed to this helper that haven't been actioned yet.
  const pending = await db.match.findMany({
    where: { helperId: me.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      client: {
        select: { id: true, clientProfile: { select: { fullName: true } } },
      },
      listing: { select: { id: true, category: true, rateMyrSen: true, pricingMode: true } },
    },
  });

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold">Inbox</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {pending.length === 0
          ? "No new interest right now. Keep your listings active to attract clients."
          : `${pending.length} client${pending.length === 1 ? "" : "s"} interested. Swipe to accept or pass.`}
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {pending.map((m) => {
          const meta = CATEGORY_META[m.listing.category];
          return (
            <li key={m.id}>
              <InterestCard
                clientId={m.client.id}
                clientName={m.client.clientProfile?.fullName ?? "Client"}
                listingId={m.listing.id}
                category={meta.label}
                emoji={meta.emoji}
                rateLabel={`RM${m.listing.rateMyrSen / 100}/${m.listing.pricingMode === "HOURLY" ? "hr" : "job"}`}
              />
            </li>
          );
        })}
      </ul>
    </main>
  );
}
