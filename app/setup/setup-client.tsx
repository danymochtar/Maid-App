"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { runMigrateAction, runSeedAction } from "./actions";

export function SetupClient({
  dbConnected,
  migrationsApplied,
  hasUsers,
}: {
  dbConnected: boolean;
  migrationsApplied: boolean;
  hasUsers: boolean;
}) {
  const [token, setToken] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function append(...lines: string[]) {
    setLogs((cur) => [...cur, ...lines]);
  }

  function runMigrate() {
    if (!token.trim()) {
      append("✗ Enter the SETUP_TOKEN first.");
      return;
    }
    startTransition(async () => {
      append("", "▸ Running migrations…");
      const r = await runMigrateAction(token);
      if (!r.ok) {
        append(`✗ ${r.error}`);
        return;
      }
      append(...r.logs, `✓ Done. Applied: ${r.applied.length}, skipped: ${r.skipped.length}`);
      router.refresh();
    });
  }

  function runSeed() {
    if (!token.trim()) {
      append("✗ Enter the SETUP_TOKEN first.");
      return;
    }
    if (
      hasUsers &&
      !confirm("This will WIPE all existing users + listings + bookings and reseed. Continue?")
    ) {
      return;
    }
    startTransition(async () => {
      append("", "▸ Seeding test data…");
      const r = await runSeedAction(token);
      if (!r.ok) {
        append(`✗ ${r.error}`);
        return;
      }
      append(...r.logs);
      router.refresh();
    });
  }

  return (
    <section className="mt-6 flex flex-col gap-3">
      <label className="block">
        <span className="text-xs font-medium text-zinc-500">SETUP_TOKEN</span>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste the value you set in Vercel"
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-3 font-mono text-sm"
          autoComplete="off"
        />
      </label>

      <button
        type="button"
        onClick={runMigrate}
        disabled={pending || !dbConnected}
        className="rounded-full bg-brand-500 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50"
      >
        {pending ? "Working…" : migrationsApplied ? "Re-check migrations" : "Apply migrations"}
      </button>

      <button
        type="button"
        onClick={runSeed}
        disabled={pending || !dbConnected || !migrationsApplied}
        className="rounded-full border border-zinc-200 bg-white py-3 font-semibold text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-50"
      >
        {hasUsers ? "Re-seed (wipes existing data)" : "Seed test data"}
      </button>

      {logs.length > 0 && (
        <pre className="mt-3 max-h-72 overflow-auto rounded-2xl bg-zinc-900 p-3 font-mono text-[11px] leading-relaxed text-emerald-200">
          {logs.join("\n")}
        </pre>
      )}
    </section>
  );
}
