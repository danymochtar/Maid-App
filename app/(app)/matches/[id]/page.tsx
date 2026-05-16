import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CATEGORY_META } from "@/lib/categories";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { ChatThread } from "./chat-thread";

export const dynamic = "force-dynamic";

export default async function MatchDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getSessionUser();
  if (!me) redirect("/login");

  const match = await db.match.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, clientProfile: { select: { fullName: true } } } },
      helper: {
        select: {
          id: true,
          helperProfile: { select: { displayName: true, tagline: true, photoUrls: true } },
        },
      },
      listing: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!match) notFound();
  if (match.clientId !== me.id && match.helperId !== me.id) notFound();

  const meta = CATEGORY_META[match.listing.category];
  const other = me.role === "HELPER"
    ? match.client.clientProfile?.fullName ?? "Client"
    : match.helper.helperProfile?.displayName ?? "Helper";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-zinc-200 bg-white p-3">
        <Link href="/matches" className="text-zinc-500">
          ←
        </Link>
        <div className="grid size-10 place-items-center rounded-full bg-brand-100 text-xl">
          {meta.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{other}</p>
          <p className="truncate text-xs text-zinc-500">
            {meta.label} · RM{match.listing.rateMyrSen / 100}/
            {match.listing.pricingMode === "HOURLY" ? "hr" : "job"}
          </p>
        </div>
        {match.status === "MATCHED" && me.role === "CLIENT" && (
          <Link
            href={`/book/${match.id}`}
            className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Book
          </Link>
        )}
      </header>

      {match.status !== "MATCHED" && (
        <div className="m-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
          {match.status === "PENDING"
            ? "Chat unlocks once both sides have right-swiped."
            : "This match is " + match.status.toLowerCase() + "."}
        </div>
      )}

      <ChatThread
        matchId={match.id}
        mySenderId={me.id}
        locked={match.status !== "MATCHED"}
        initialMessages={match.messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          body: m.bodyRedacted,
          redactedTypes: m.redactedPiiTypes,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
