"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { transitionBookingAction } from "./actions";

type Props = {
  bookingId: string;
  status: string;
  viewerRole: "CLIENT" | "HELPER" | "ADMIN";
  paymentStatus: string | null;
};

export function BookingActions({ bookingId, status, viewerRole, paymentStatus }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function call(action: string) {
    setError(null);
    startTransition(async () => {
      const r = await transitionBookingAction(bookingId, action);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  }

  const buttons: { label: string; action: string; primary?: boolean }[] = [];

  if (viewerRole === "HELPER") {
    if (status === "REQUESTED") {
      buttons.push({ label: "Accept job", action: "accept", primary: true });
      buttons.push({ label: "Reject", action: "reject" });
    }
    if (status === "ACCEPTED") buttons.push({ label: "Check in (arrived)", action: "checkin", primary: true });
    if (status === "CHECKED_IN") buttons.push({ label: "Mark in progress", action: "start", primary: true });
    if (status === "IN_PROGRESS") buttons.push({ label: "Mark complete", action: "complete", primary: true });
  }
  if (viewerRole === "CLIENT") {
    if (status === "REQUESTED" && paymentStatus === "PENDING")
      buttons.push({ label: "Simulate payment success", action: "mock-pay", primary: true });
    if (status === "COMPLETED")
      buttons.push({ label: "Confirm & release payout", action: "confirm-completion", primary: true });
    if (["REQUESTED", "ACCEPTED"].includes(status))
      buttons.push({ label: "Cancel booking", action: "cancel" });
  }

  if (buttons.length === 0)
    return (
      <p className="mt-4 rounded-xl bg-zinc-100 p-3 text-center text-xs text-zinc-500">
        No actions available in status <strong>{status}</strong>.
      </p>
    );

  return (
    <div className="mt-4 flex flex-col gap-2">
      {buttons.map((b) => (
        <button
          type="button"
          key={b.action}
          disabled={pending}
          onClick={() => call(b.action)}
          className={`rounded-full py-3 font-semibold transition disabled:opacity-60 ${
            b.primary
              ? "bg-brand-500 text-white hover:bg-brand-600"
              : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          {b.label}
        </button>
      ))}
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
