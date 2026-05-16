"use server";

import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { runMigrations } from "@/lib/migrate";
import { seedDatabase } from "@/prisma/seed";

type MigrateResult =
  | { ok: true; applied: string[]; skipped: string[]; logs: string[] }
  | { ok: false; error: string };

type SeedResult =
  | { ok: true; logs: string[] }
  | { ok: false; error: string };

function checkToken(provided: string): { ok: boolean; reason?: string } {
  const expected = process.env.SETUP_TOKEN;
  if (!expected) return { ok: false, reason: "SETUP_TOKEN env var not set on the server" };
  if (provided.length === 0) return { ok: false, reason: "Empty token" };

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return { ok: false, reason: "Invalid token" };
  return { ok: timingSafeEqual(a, b), reason: "Invalid token" };
}

export async function runMigrateAction(token: string): Promise<MigrateResult> {
  const tok = checkToken(token);
  if (!tok.ok) return { ok: false, error: tok.reason ?? "Forbidden" };

  const logs: string[] = [];
  try {
    const r = await runMigrations(db, (m) => logs.push(m));
    return { ok: true, applied: r.applied, skipped: r.skipped, logs };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logs.push(`✗ ${msg}`);
    return { ok: false, error: msg };
  }
}

export async function runSeedAction(token: string): Promise<SeedResult> {
  const tok = checkToken(token);
  if (!tok.ok) return { ok: false, error: tok.reason ?? "Forbidden" };

  const logs: string[] = [];
  try {
    const r = await seedDatabase(db, (m) => logs.push(m));
    logs.push("", `✓ Seed complete. ${r.helpers} helpers, ${r.listings} listings, ${r.clients} clients.`);
    return { ok: true, logs };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logs.push(`✗ ${msg}`);
    return { ok: false, error: msg };
  }
}
