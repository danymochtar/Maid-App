import { db } from "@/lib/db";
import { SetupClient } from "./setup-client";

export const dynamic = "force-dynamic";

async function dbHealth() {
  try {
    await db.$queryRaw`SELECT 1`;
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
  }
}

async function migrationsStatus() {
  try {
    const rows = await db.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "_setup_migrations" ORDER BY id`,
    );
    return { table: "exists" as const, ids: rows.map((r) => r.id) };
  } catch {
    return { table: "missing" as const, ids: [] };
  }
}

async function userCount() {
  try {
    return await db.user.count();
  } catch {
    return null;
  }
}

export default async function SetupPage() {
  const [health, migrations, users] = await Promise.all([
    dbHealth(),
    migrationsStatus(),
    userCount(),
  ]);

  const hasSetupToken = !!process.env.SETUP_TOKEN;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col p-6">
      <h1 className="text-2xl font-bold">🍒 Pembantu setup</h1>
      <p className="mt-2 text-sm text-zinc-500">
        One-time bootstrap: apply schema migrations and seed test data on a fresh deployment.
      </p>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-center justify-between">
            <span>Database connection</span>
            <Pill ok={health.ok} okLabel="connected" badLabel="unreachable" />
          </li>
          <li className="flex items-center justify-between">
            <span>Schema migrations</span>
            <Pill
              ok={migrations.table === "exists" && migrations.ids.length > 0}
              okLabel={`${migrations.ids.length} applied`}
              badLabel="not applied"
            />
          </li>
          <li className="flex items-center justify-between">
            <span>Seeded users</span>
            <Pill
              ok={(users ?? 0) > 0}
              okLabel={`${users} rows`}
              badLabel={users === null ? "table missing" : "empty"}
            />
          </li>
          <li className="flex items-center justify-between">
            <span>SETUP_TOKEN env var</span>
            <Pill ok={hasSetupToken} okLabel="set" badLabel="not set" />
          </li>
        </ul>
        {!health.ok && (
          <p className="mt-3 rounded-lg bg-rose-50 p-2 font-mono text-[11px] text-rose-800">
            {health.error}
          </p>
        )}
      </section>

      {!hasSetupToken ? (
        <section className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">SETUP_TOKEN is not set on this deployment.</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-amber-900/90">
            <li>Vercel dashboard → this project → Settings → Environment Variables</li>
            <li>
              Add <code className="rounded bg-white px-1">SETUP_TOKEN</code> with any random
              string (≥ 16 chars). Generate one anywhere — even a password manager will do.
            </li>
            <li>Save → redeploy from the Deployments tab → reload this page.</li>
          </ol>
        </section>
      ) : (
        <SetupClient
          dbConnected={health.ok}
          migrationsApplied={migrations.ids.length > 0}
          hasUsers={(users ?? 0) > 0}
        />
      )}

      <p className="mt-8 text-center text-[11px] text-zinc-400">
        This page is safe to keep in production — every mutating action requires the
        SETUP_TOKEN. Remove the page once you no longer need it.
      </p>
    </main>
  );
}

function Pill({ ok, okLabel, badLabel }: { ok: boolean; okLabel: string; badLabel: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
      }`}
    >
      {ok ? "✓ " : "✗ "}
      {ok ? okLabel : badLabel}
    </span>
  );
}
