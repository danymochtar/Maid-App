import Image from "next/image";
import { CATEGORY_META } from "@/lib/categories";
import type { StackCard } from "@/lib/actions/discover";

function formatRate(card: StackCard) {
  const myr = (card.rateMyrSen / 100).toFixed(0);
  return card.pricingMode === "HOURLY" ? `RM${myr}/hr` : `RM${myr}/job`;
}

export function HelperCard({ card }: { card: StackCard }) {
  const meta = CATEGORY_META[card.category];
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-zinc-200">
      <div className="relative aspect-[3/4] w-full bg-zinc-100">
        {card.photoUrl ? (
          <Image
            src={card.photoUrl}
            alt={card.displayName}
            fill
            sizes="(max-width: 420px) 100vw, 420px"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-7xl">{meta.emoji}</div>
        )}
        <div className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white backdrop-blur">
          {formatRate(card)}
        </div>
        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-zinc-900 backdrop-blur">
          {meta.emoji} {meta.label}
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-white">
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl font-bold">{card.displayName}</h2>
            {card.ratingCount > 0 && (
              <span className="text-sm">
                ⭐ {card.ratingAvg.toFixed(1)} · {card.completedJobs} jobs
              </span>
            )}
          </div>
          {card.tagline && <p className="mt-1 text-sm text-zinc-100">{card.tagline}</p>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {card.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {card.skills.map((s) => (
              <span
                key={s}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
              >
                {s}
              </span>
            ))}
          </div>
        )}
        {card.distanceKm != null && (
          <p className="text-xs text-zinc-500">~{card.distanceKm.toFixed(1)} km away</p>
        )}
      </div>
    </div>
  );
}
