import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { CATEGORY_META } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  const matches = await db.match.findMany({
    where: me.role === "HELPER" ? { helperId: me.id } : { clientId: me.id },
    orderBy: { matchedAt: "desc" },
    include: {
      client: { select: { clientProfile: { select: { fullName: true } } } },
      helper: { select: { helperProfile: { select: { displayName: true, photoUrls: true } } } },
      listing: { select: { category: true, rateMyrSen: true, pricingMode: true } },
      messages: { take: 1, orderBy: { createdAt: "desc" } },
    },
  });

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold">Matches</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {matches.length === 0
          ? "No matches yet — swipe on the discover screen to start."
          : `${matches.length} ${matches.length === 1 ? "match" : "matches"}`}
      </p>

      <ul className="mt-4 flex flex-col gap-2">
        {matches.map((m) => {
          const meta = CATEGORY_META[m.listing.category];
          const other = me.role === "HELPER"
            ? m.client.clientProfile?.fullName ?? "Client"
            : m.helper.helperProfile?.displayName ?? "Helper";
          const lastMsg = m.messages[0]?.bodyRedacted ?? "Say hi 👋";
          return (
            <li key={m.id}>
              <Link
                href={`/matches/${m.id}`}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 transition hover:border-brand-300"
              >
                <div className="grid size-12 place-items-center rounded-full bg-brand-100 text-2xl">
                  {meta.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate font-semibold">{other}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        m.status === "MATCHED"
                          ? "bg-emerald-100 text-emerald-700"
                          : m.status === "PENDING"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <p className="truncate text-xs text-zinc-500">
                    {meta.label} · RM{m.listing.rateMyrSen / 100}/
                    {m.listing.pricingMode === "HOURLY" ? "hr" : "job"}
                  </p>
                  <p className="mt-1 truncate text-sm text-zinc-700">{lastMsg}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
