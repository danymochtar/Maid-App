import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { PrismaClient } from "@prisma/client";

const MIGRATIONS_DIR = join(process.cwd(), "prisma", "migrations");

export type MigrationLog = (msg: string) => void;

/**
 * Runs every `prisma/migrations/<id>/migration.sql` against the connected DB.
 * Idempotent: tracks applied IDs in a `_setup_migrations` table so re-runs
 * skip what's already done. NOT a substitute for `prisma migrate deploy` —
 * this is a serverless-friendly fallback so the user can bootstrap a fresh
 * Vercel database without needing a local CLI.
 */
export async function runMigrations(db: PrismaClient, log: MigrationLog = console.log) {
  log("Connecting to database…");
  await db.$queryRawUnsafe<unknown[]>(`SELECT 1`);
  log("✓ Connected");

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_setup_migrations" (
      "id" TEXT PRIMARY KEY,
      "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const dirs = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  log(`Found ${dirs.length} migration${dirs.length === 1 ? "" : "s"}`);
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const id of dirs) {
    const existing = await db.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "_setup_migrations" WHERE id = $1`,
      id,
    );
    if (existing.length > 0) {
      log(`  ↪ ${id} (already applied)`);
      skipped.push(id);
      continue;
    }

    const sqlPath = join(MIGRATIONS_DIR, id, "migration.sql");
    const sql = readFileSync(sqlPath, "utf-8");
    log(`  ⟳ ${id} (${sql.length} bytes)`);

    // Prisma generates one statement per `;` terminator. Split safely:
    // drop SQL comments, then split on `;` at end of line.
    const statements = sql
      .replace(/--[^\n]*\n/g, "\n")
      .split(/;\s*(?=\n|$)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      await db.$executeRawUnsafe(stmt);
    }

    await db.$executeRawUnsafe(`INSERT INTO "_setup_migrations" (id) VALUES ($1)`, id);
    log(`  ✓ ${id} (${statements.length} statements)`);
    applied.push(id);
  }

  return { applied, skipped, total: dirs.length };
}
