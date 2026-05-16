"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBookingAction } from "./actions";

type Props = {
  matchId: string;
  pricingMode: "HOURLY" | "PER_JOB";
  rateMyrSen: number;
  addresses: { id: string; label: string }[];
};

function formatDateTimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function BookingForm({ matchId, pricingMode, rateMyrSen, addresses }: Props) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const [scheduledStart, setScheduledStart] = useState(formatDateTimeLocal(tomorrow));
  const [hours, setHours] = useState(3);
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const totalMyr = useMemo(() => {
    if (pricingMode === "HOURLY") return (rateMyrSen * hours) / 100;
    return rateMyrSen / 100;
  }, [pricingMode, rateMyrSen, hours]);

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await createBookingAction({
        matchId,
        scheduledStart: new Date(scheduledStart).toISOString(),
        durationHours: pricingMode === "HOURLY" ? hours : null,
        addressId,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.push(`/bookings/${r.bookingId}`);
    });
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <label className="block">
        <span className="text-xs font-medium text-zinc-500">When?</span>
        <input
          type="datetime-local"
          value={scheduledStart}
          onChange={(e) => setScheduledStart(e.target.value)}
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-base"
        />
      </label>

      {pricingMode === "HOURLY" && (
        <label className="block">
          <span className="text-xs font-medium text-zinc-500">Duration (hours)</span>
          <input
            type="number"
            min={1}
            max={12}
            value={hours}
            onChange={(e) => setHours(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-base"
          />
        </label>
      )}

      <label className="block">
        <span className="text-xs font-medium text-zinc-500">Address</span>
        <select
          value={addressId}
          onChange={(e) => setAddressId(e.target.value)}
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-base"
        >
          {addresses.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-2xl bg-brand-50 p-4">
        <p className="text-xs font-medium text-brand-900/70">Estimated total</p>
        <p className="text-3xl font-bold text-brand-700">RM{totalMyr.toFixed(2)}</p>
        <p className="mt-1 text-xs text-brand-900/70">
          {pricingMode === "HOURLY"
            ? `RM${rateMyrSen / 100}/hr × ${hours}h`
            : `Fixed per-job price`}
        </p>
        <p className="mt-2 text-[11px] text-brand-900/60">
          We hold payment via Billplz and only release to the helper 48h after you confirm completion.
        </p>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <button
        type="button"
        disabled={pending}
        onClick={submit}
        className="rounded-full bg-brand-500 py-4 font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-60"
      >
        {pending ? "Creating booking…" : "Confirm booking"}
      </button>
    </div>
  );
}
