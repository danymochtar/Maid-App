"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { respondInterestAction } from "./actions";

type Props = {
  clientId: string;
  clientName: string;
  listingId: string;
  category: string;
  emoji: string;
  rateLabel: string;
};

export function InterestCard(props: Props) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<"matched" | "passed" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function respond(direction: "LEFT" | "RIGHT") {
    setError(null);
    startTransition(async () => {
      const r = await respondInterestAction(props.clientId, props.listingId, direction);
      if (!r.ok) {
        setError(r.error ?? "Failed");
        return;
      }
      if (r.matched) {
        setDone("matched");
        setTimeout(() => router.refresh(), 1200);
      } else {
        setDone("passed");
        setTimeout(() => router.refresh(), 800);
      }
    });
  }

  if (done === "matched") {
    return (
      <div className="rounded-2xl bg-brand-500 p-4 text-center text-white">
        <p className="text-2xl">🎉 It's a match!</p>
        <p className="text-sm">Chat unlocked. Refreshing…</p>
      </div>
    );
  }
  if (done === "passed") {
    return (
      <div className="rounded-2xl bg-zinc-100 p-4 text-center text-sm text-zinc-500">Passed</div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3">
      <div className="grid size-12 place-items-center rounded-full bg-brand-100 text-2xl">
        {props.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{props.clientName}</p>
        <p className="truncate text-xs text-zinc-500">
          interested in {props.category} · {props.rateLabel}
        </p>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => respond("LEFT")}
          className="grid size-10 place-items-center rounded-full bg-zinc-100 disabled:opacity-50"
          aria-label="Pass"
        >
          ✕
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => respond("RIGHT")}
          className="grid size-10 place-items-center rounded-full bg-brand-500 text-white disabled:opacity-50"
          aria-label="Accept"
        >
          ♥
        </button>
      </div>
    </div>
  );
}
