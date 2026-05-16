"use client";

import { ServiceCategory } from "@prisma/client";
import { useState } from "react";
import { ALL_CATEGORIES, CATEGORY_META } from "@/lib/categories";

export type StackFilters = {
  category: ServiceCategory;
  postcode: string;
  maxRateMyrSen?: number;
  minRating: number;
  skillQuery?: string;
};

type Props = {
  value: StackFilters;
  enabledCategories: ServiceCategory[];
  onApply: (f: StackFilters) => void;
};

export function FiltersDrawer({ value, enabledCategories, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(value);
  const meta = CATEGORY_META[local.category];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium shadow ring-1 ring-zinc-200"
      >
        <span>{meta.emoji}</span>
        <span>{meta.label}</span>
        <span className="text-zinc-400">·</span>
        <span className="text-zinc-600">{local.postcode}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300" />
            <h3 className="text-lg font-semibold">Filter helpers</h3>

            <label className="mt-4 block text-xs font-medium text-zinc-500">Category</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {ALL_CATEGORIES.filter((c) => enabledCategories.includes(c)).map((c) => {
                const m = CATEGORY_META[c];
                const active = local.category === c;
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setLocal({ ...local, category: c })}
                    className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-xs font-medium transition ${
                      active
                        ? "border-brand-500 bg-brand-50 text-brand-900"
                        : "border-zinc-200 bg-white text-zinc-700"
                    }`}
                  >
                    <span className="text-xl">{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            <label className="mt-4 block text-xs font-medium text-zinc-500">Postcode</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{5}"
              maxLength={5}
              value={local.postcode}
              onChange={(e) => setLocal({ ...local, postcode: e.target.value.replace(/\D/g, "") })}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-base"
            />

            <label className="mt-4 block text-xs font-medium text-zinc-500">Max rate (RM)</label>
            <input
              type="number"
              min={5}
              value={local.maxRateMyrSen ? local.maxRateMyrSen / 100 : ""}
              onChange={(e) =>
                setLocal({
                  ...local,
                  maxRateMyrSen: e.target.value ? Number(e.target.value) * 100 : undefined,
                })
              }
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-base"
              placeholder="No limit"
            />

            <label className="mt-4 block text-xs font-medium text-zinc-500">Skill keyword</label>
            <input
              type="text"
              value={local.skillQuery ?? ""}
              onChange={(e) => setLocal({ ...local, skillQuery: e.target.value || undefined })}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-base"
              placeholder="e.g. deep clean"
            />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full border border-zinc-200 py-3 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(local);
                  setOpen(false);
                }}
                className="flex-1 rounded-full bg-brand-500 py-3 font-semibold text-white"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
