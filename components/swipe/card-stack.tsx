"use client";

import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useMemo, useState, useTransition } from "react";
import { SwipeDirection } from "@prisma/client";
import type { StackCard } from "@/lib/actions/discover";
import { HelperCard } from "./helper-card";

type Props = {
  initialCards: StackCard[];
  loadMore: (cursor: string | null) => Promise<StackCard[]>;
  onSwipe: (
    listingId: string,
    direction: SwipeDirection,
  ) => Promise<{ matched: boolean; matchId?: string } | null>;
};

const SWIPE_THRESHOLD = 120;

export function CardStack({ initialCards, loadMore, onSwipe }: Props) {
  const [cards, setCards] = useState<StackCard[]>(initialCards);
  const [exhausted, setExhausted] = useState(initialCards.length === 0);
  const [matchOverlay, setMatchOverlay] = useState<StackCard | null>(null);
  const [_, startTransition] = useTransition();

  useEffect(() => {
    if (cards.length <= 3 && !exhausted) {
      const lastId = cards.at(-1)?.listingId ?? null;
      loadMore(lastId).then((more) => {
        if (more.length === 0) setExhausted(true);
        else setCards((c) => [...c, ...more.filter((m) => !c.find((x) => x.listingId === m.listingId))]);
      });
    }
  }, [cards, exhausted, loadMore]);

  const top = cards[0];

  function handleSwipe(direction: SwipeDirection) {
    if (!top) return;
    const card = top;
    setCards((c) => c.slice(1));
    startTransition(async () => {
      const r = await onSwipe(card.listingId, direction);
      if (r?.matched) setMatchOverlay(card);
    });
  }

  if (!top && exhausted) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl">🛏️</div>
        <h3 className="mt-4 text-xl font-semibold">All caught up</h3>
        <p className="mt-2 text-zinc-500">
          No more helpers in this area for now. Broaden filters or check back tomorrow.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="relative flex-1">
        <AnimatePresence>
          {cards.slice(0, 3).map((card, idx) => (
            <DraggableCard
              key={card.listingId}
              card={card}
              isTop={idx === 0}
              offset={idx}
              onCommit={(d) => handleSwipe(d)}
            />
          ))}
        </AnimatePresence>
      </div>

      <ActionBar onAction={handleSwipe} disabled={!top} />

      <AnimatePresence>
        {matchOverlay && (
          <MatchCelebration card={matchOverlay} onDone={() => setMatchOverlay(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function DraggableCard({
  card,
  isTop,
  offset,
  onCommit,
}: {
  card: StackCard;
  isTop: boolean;
  offset: number;
  onCommit: (d: SwipeDirection) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const nopeOpacity = useTransform(x, [-140, -40], [1, 0]);

  const scale = useMemo(() => 1 - offset * 0.04, [offset]);
  const translateY = useMemo(() => offset * 8, [offset]);

  return (
    <motion.div
      className="absolute inset-x-2 top-0 mx-auto h-full max-w-md cursor-grab active:cursor-grabbing"
      style={{ x: isTop ? x : 0, rotate: isTop ? rotate : 0, scale, y: translateY, zIndex: 10 - offset }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        if (info.offset.x > SWIPE_THRESHOLD) onCommit(SwipeDirection.RIGHT);
        else if (info.offset.x < -SWIPE_THRESHOLD) onCommit(SwipeDirection.LEFT);
      }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale, opacity: 1 }}
      exit={{ x: x.get() > 0 ? 600 : -600, opacity: 0, transition: { duration: 0.25 } }}
    >
      <div className="relative h-full">
        <HelperCard card={card} />
        {isTop && (
          <>
            <motion.div
              style={{ opacity: likeOpacity }}
              className="pointer-events-none absolute left-6 top-8 rotate-[-15deg] rounded-lg border-4 border-emerald-500 px-3 py-1 text-2xl font-extrabold text-emerald-500"
            >
              INTERESTED
            </motion.div>
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="pointer-events-none absolute right-6 top-8 rotate-[15deg] rounded-lg border-4 border-rose-500 px-3 py-1 text-2xl font-extrabold text-rose-500"
            >
              PASS
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function ActionBar({
  onAction,
  disabled,
}: {
  onAction: (d: SwipeDirection) => void;
  disabled: boolean;
}) {
  return (
    <div className="mt-4 flex items-center justify-center gap-6 pb-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAction(SwipeDirection.LEFT)}
        className="grid size-16 place-items-center rounded-full bg-white text-2xl shadow-md ring-1 ring-zinc-200 transition active:scale-95 disabled:opacity-40"
        aria-label="Pass"
      >
        ✕
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAction(SwipeDirection.SUPER)}
        className="grid size-14 place-items-center rounded-full bg-white text-xl shadow-md ring-1 ring-zinc-200 transition active:scale-95 disabled:opacity-40"
        aria-label="Super like"
      >
        ⭐
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAction(SwipeDirection.RIGHT)}
        className="grid size-16 place-items-center rounded-full bg-brand-500 text-2xl text-white shadow-md transition active:scale-95 disabled:opacity-40"
        aria-label="Interested"
      >
        ♥
      </button>
    </div>
  );
}

function MatchCelebration({ card, onDone }: { card: StackCard; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-500/95 p-8 text-center text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.h2
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        className="text-5xl font-extrabold"
      >
        It's a match! 🎉
      </motion.h2>
      <p className="mt-3 max-w-xs text-lg">
        You and {card.displayName} are matched. Chat opens in your matches list.
      </p>
      <button
        type="button"
        onClick={onDone}
        className="mt-8 rounded-full bg-white px-6 py-3 font-semibold text-brand-600"
      >
        Keep swiping
      </button>
    </motion.div>
  );
}
