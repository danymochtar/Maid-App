"use client";

import { ServiceCategory } from "@prisma/client";
import { useState } from "react";
import { CardStack } from "@/components/swipe/card-stack";
import { FiltersDrawer, type StackFilters } from "@/components/swipe/filters-drawer";
import type { StackCard } from "@/lib/actions/discover";
import { loadMoreAction, swipeAction } from "./actions";

type Props = {
  initialCards: StackCard[];
  initialFilters: StackFilters;
  enabledCategories: ServiceCategory[];
};

export function DiscoverClient({ initialCards, initialFilters, enabledCategories }: Props) {
  const [filters, setFilters] = useState(initialFilters);
  const [cards, setCards] = useState(initialCards);
  const [version, setVersion] = useState(0); // remount stack on filter change

  async function refetch(f: StackFilters) {
    setFilters(f);
    const more = await loadMoreAction(f, null);
    setCards(more);
    setVersion((v) => v + 1);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-zinc-50">
      <header className="flex items-center justify-between p-4">
        <h1 className="text-lg font-bold">Pembantu</h1>
        <FiltersDrawer value={filters} enabledCategories={enabledCategories} onApply={refetch} />
      </header>

      <div className="relative flex-1 px-2 pb-4">
        <CardStack
          key={version}
          initialCards={cards}
          loadMore={(cursor) => loadMoreAction(filters, cursor)}
          onSwipe={async (listingId, direction) => {
            const r = await swipeAction(listingId, direction);
            if (!r.ok) return null;
            return r.matched ? { matched: true, matchId: r.matchId } : { matched: false };
          }}
        />
      </div>
    </main>
  );
}
