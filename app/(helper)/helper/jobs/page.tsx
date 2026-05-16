import Link from "next/link";
import { CATEGORY_META } from "@/lib/categories";
import { db } from "@/lib/db";
import { requireSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-blue-100 text-blue-800",
  CHECKED_IN: "bg-indigo-100 text-indigo-800",
  IN_PROGRESS: "bg-violet-100 text-violet-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-zinc-100 text-zinc-600",
  REJECTED: "bg-zinc-100 text-zinc-600",
  DISPUTED: "bg-rose-100 text-rose-800",
  REFUNDED: "bg-zinc-100 text-zinc-600",
};

export default async function HelperJobs() {
  const me = await requireSessionUser();

  const jobs = await db.booking.findMany({
    where: { helperId: me.id },
    orderBy: { scheduledStart: "desc" },
    include: {
      client: { select: { clientProfile: { select: { fullName: true } } } },
      address: true,
    },
    take: 50,
  });

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold">Jobs</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {jobs.length === 0 ? "No jobs yet — accept a match to receive bookings." : `${jobs.length} total`}
      </p>

      <ul className="mt-4 flex flex-col gap-2">
        {jobs.map((b) => {
          const meta = CATEGORY_META[b.category];
          return (
            <li key={b.id}>
              <Link
                href={`/bookings/${b.id}`}
                className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-3"
              >
                <div className="grid size-10 place-items-center rounded-full bg-brand-100 text-xl">
                  {meta.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">
                      {b.client.clientProfile?.fullName ?? "Client"}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLOR[b.status]}`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">{meta.label}</p>
                  <p className="text-xs text-zinc-500">
                    {b.scheduledStart.toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {b.address.line1}, {b.address.postcode} {b.address.city}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-700">
                    RM{(b.estTotalMyrSen / 100).toFixed(2)}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
