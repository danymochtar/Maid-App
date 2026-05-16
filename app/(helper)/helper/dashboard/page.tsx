import Link from "next/link";
import { CATEGORY_META } from "@/lib/categories";
import { db } from "@/lib/db";
import { requireSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HelperDashboard() {
  const me = await requireSessionUser();

  const [profile, listings, pendingCount, matchedCount, jobs] = await db.$transaction([
    db.helperProfile.findUnique({ where: { userId: me.id } }),
    db.helperListing.findMany({ where: { helperId: me.id }, orderBy: { createdAt: "desc" } }),
    db.match.count({ where: { helperId: me.id, status: "PENDING" } }),
    db.match.count({ where: { helperId: me.id, status: "MATCHED" } }),
    db.booking.count({ where: { helperId: me.id, status: { in: ["REQUESTED", "ACCEPTED", "IN_PROGRESS"] } } }),
  ]);

  return (
    <main className="mx-auto max-w-md p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hi, {profile?.displayName ?? me.displayName}</h1>
          <p className="text-sm text-zinc-500">{profile?.tagline}</p>
        </div>
        <form action="/api/logout" method="post">
          <button className="text-xs text-zinc-500 underline">Sign out</button>
        </form>
      </header>

      <section className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Inbox" value={pendingCount} accent="amber" />
        <Stat label="Matches" value={matchedCount} accent="emerald" />
        <Stat label="Active jobs" value={jobs} accent="brand" />
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your listings</h2>
          <span className="text-xs text-zinc-500">{listings.length} active</span>
        </div>
        <ul className="mt-2 flex flex-col gap-2">
          {listings.length === 0 && (
            <li className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
              No listings yet. (Listing CRUD UI ships in step 7 of the plan.)
            </li>
          )}
          {listings.map((l) => {
            const meta = CATEGORY_META[l.category];
            return (
              <li
                key={l.id}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3"
              >
                <div className="grid size-10 place-items-center rounded-full bg-brand-100 text-xl">
                  {meta.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{meta.label}</p>
                  <p className="text-xs text-zinc-500">
                    RM{l.rateMyrSen / 100}/{l.pricingMode === "HOURLY" ? "hr" : "job"}
                    {l.skills.length > 0 && ` · ${l.skills.slice(0, 3).join(", ")}`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    l.active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {l.active ? "ACTIVE" : "OFF"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl bg-brand-50 p-4 text-sm">
        <p className="font-semibold text-brand-900">Trust profile</p>
        <ul className="mt-2 space-y-1 text-brand-900/80">
          <li>⭐ Rating: {profile?.ratingAvg.toFixed(2) ?? "—"} ({profile?.ratingCount ?? 0} reviews)</li>
          <li>✅ Completed jobs: {profile?.completedJobs ?? 0}</li>
          <li>
            🤝 Acceptance rate: {profile ? Math.round(profile.acceptanceRate * 100) : 0}%
          </li>
          <li>📞 Verification: {profile ? "Phone OTP" : "—"}</li>
        </ul>
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "amber" | "emerald" | "brand";
}) {
  const colors =
    accent === "amber"
      ? "bg-amber-50 text-amber-900"
      : accent === "emerald"
        ? "bg-emerald-50 text-emerald-900"
        : "bg-brand-50 text-brand-900";
  return (
    <div className={`rounded-2xl p-3 ${colors}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
