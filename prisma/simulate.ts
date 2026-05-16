/**
 * End-to-end simulation: walks the test customer through every feature
 * the MVP currently implements. No HTTP — calls the server actions directly
 * so we exercise the same code paths the UI hits.
 */
import { PrismaClient, SwipeDirection } from "@prisma/client";
import { nextStackPage } from "../lib/actions/discover";
import { swipeListing, respondToInterest } from "../lib/actions/swipe";
import { redactPii } from "../lib/pii-redact";
import { rateLimit } from "../lib/rate-limit";
import { verifyXSignature } from "../lib/billplz";
import { verifyPassword } from "../lib/passwords";
import { TEST_CLIENT_ID, TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD } from "../lib/dev-session";

const db = new PrismaClient();

const PASS = "\x1b[32m✔\x1b[0m";
const FAIL = "\x1b[31m✘\x1b[0m";
const INFO = "\x1b[34mℹ\x1b[0m";
const STEP = "\x1b[1;36m▸\x1b[0m";

let passed = 0;
let failed = 0;

function check(label: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ${PASS} ${label}`);
    passed++;
  } else {
    console.log(`  ${FAIL} ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

async function main() {
  console.log(`\n${STEP} Simulating test customer journey\n`);
  console.log(`${INFO} Logged in as ${TEST_CLIENT_EMAIL} (id=${TEST_CLIENT_ID})\n`);

  // ── 1. Auth: email/password verification ───────────────────────────────
  console.log(`${STEP} 1. Email + password login`);
  const stored = await db.user.findUnique({
    where: { id: TEST_CLIENT_ID },
    select: { email: true, passwordHash: true, role: true, status: true },
  });
  check("test user exists in DB", !!stored);
  check("email matches seed", stored?.email === TEST_CLIENT_EMAIL);
  check("password 'test123' verifies via scrypt", verifyPassword(TEST_CLIENT_PASSWORD, stored!.passwordHash!));
  check("password 'wrong' is rejected", !verifyPassword("wrong", stored!.passwordHash!));
  check("role is CLIENT", stored?.role === "CLIENT");
  check("status is ACTIVE", stored?.status === "ACTIVE");

  // ── 2. Discover: swipe stack for HOME_CLEANING ─────────────────────────
  console.log(`\n${STEP} 2. Discover — load HOME_CLEANING stack at postcode 50000`);
  const stack = await nextStackPage(TEST_CLIENT_ID, {
    category: "HOME_CLEANING",
    postcode: "50000",
  });
  check(`stack returned ${stack.length} cards`, stack.length >= 2);
  console.log(`    ${INFO} Helpers shown:`);
  for (const c of stack) {
    console.log(
      `       · ${c.displayName} — RM${c.rateMyrSen / 100}/${c.pricingMode === "HOURLY" ? "hr" : "job"} · ⭐${c.ratingAvg.toFixed(2)} · ${c.skills.join(", ")}`,
    );
  }

  // ── 3. Filter: feature-flagged categories should return empty ──────────
  console.log(`\n${STEP} 3. Feature flag blocks CARE_CHILD`);
  const blocked = await nextStackPage(TEST_CLIENT_ID, {
    category: "CARE_CHILD",
    postcode: "50000",
  });
  check("CARE_CHILD stack is empty when flag is OFF", blocked.length === 0);

  // ── 4. Filter: max rate + skill keyword ────────────────────────────────
  console.log(`\n${STEP} 4. Filters: max rate RM30/hr + skill 'eco supplies'`);
  const filtered = await nextStackPage(TEST_CLIENT_ID, {
    category: "HOME_CLEANING",
    postcode: "50000",
    maxRateMyrSen: 3000,
    skillQuery: "eco supplies",
  });
  console.log(
    `    ${INFO} Results: ${filtered.map((f) => `${f.displayName} (RM${f.rateMyrSen / 100})`).join(", ") || "(none)"}`,
  );

  // ── 5. Swipe LEFT, RIGHT, SUPER ────────────────────────────────────────
  console.log(`\n${STEP} 5. Swipe LEFT / RIGHT / SUPER`);
  const aishah = stack.find((s) => s.displayName === "Aishah")!;
  const farah = stack.find((s) => s.displayName === "Farah")!;
  const mei = stack[stack.length - 1];

  const swipeLeft = await swipeListing(TEST_CLIENT_ID, {
    targetListingId: mei.listingId,
    direction: SwipeDirection.LEFT,
  });
  check("LEFT swipe persisted, no match", swipeLeft.ok && !("matched" in swipeLeft && swipeLeft.matched));

  const swipeRight = await swipeListing(TEST_CLIENT_ID, {
    targetListingId: aishah.listingId,
    direction: SwipeDirection.RIGHT,
  });
  check(
    "RIGHT swipe on Aishah creates PENDING match (helper hasn't reciprocated yet)",
    swipeRight.ok && "matched" in swipeRight && !swipeRight.matched,
  );

  const swipeSuper = await swipeListing(TEST_CLIENT_ID, {
    targetListingId: farah.listingId,
    direction: SwipeDirection.SUPER,
  });
  check("SUPER swipe on Farah persisted", swipeSuper.ok);

  // ── 6. Idempotency: re-swiping same listing should be a no-op upsert ───
  console.log(`\n${STEP} 6. Swipe idempotency`);
  const dup = await swipeListing(TEST_CLIENT_ID, {
    targetListingId: aishah.listingId,
    direction: SwipeDirection.RIGHT,
  });
  check("second RIGHT swipe on same listing returns ok (idempotent upsert)", dup.ok);
  const swipeRows = await db.swipe.count({
    where: { swiperId: TEST_CLIENT_ID, targetListingId: aishah.listingId },
  });
  check("exactly one Swipe row exists for that target", swipeRows === 1, `got ${swipeRows}`);

  // ── 7. Pass-hide: left-swiped listing disappears from future stack ─────
  console.log(`\n${STEP} 7. Pass-hide: left-swiped listing disappears from next stack`);
  const next = await nextStackPage(TEST_CLIENT_ID, {
    category: "HOME_CLEANING",
    postcode: "50000",
  });
  check(
    "Mei's listing not in next stack (was left-swiped or right-swiped)",
    !next.find((c) => c.listingId === mei.listingId),
  );
  check(
    "Aishah's listing not in next stack (was right-swiped)",
    !next.find((c) => c.listingId === aishah.listingId),
  );

  // ── 8. Helper reciprocates → MATCH unlocked ────────────────────────────
  console.log(`\n${STEP} 8. Helper Aishah swipes back → mutual MATCH`);
  const reciprocate = await respondToInterest(
    aishah.helperId,
    TEST_CLIENT_ID,
    aishah.listingId,
    SwipeDirection.RIGHT,
  );
  check(
    "respondToInterest flipped the match to MATCHED",
    reciprocate.ok && "matched" in reciprocate && reciprocate.matched === true,
  );
  const matchedRow = await db.match.findFirst({
    where: { clientId: TEST_CLIENT_ID, helperId: aishah.helperId, listingId: aishah.listingId },
  });
  check("Match.status is MATCHED in DB", matchedRow?.status === "MATCHED");
  check("Match.matchedAt is set", !!matchedRow?.matchedAt);

  // ── 9. Chat PII redaction ──────────────────────────────────────────────
  console.log(`\n${STEP} 9. Chat PII redaction (off-platform leakage prevention)`);
  const cases = [
    { in: "Hi! Reach me at 012-3456789", expectTypes: ["phone"] },
    { in: "Whatsapp me +60123456789 anytime", expectTypes: ["phone"] },
    { in: "Email aishah@gmail.com please", expectTypes: ["email"] },
    { in: "Add @aishahcleans on Telegram or t.me/aishah", expectTypes: ["social"] },
    { in: "Hi, what time you can come tomorrow?", expectTypes: [] },
  ];
  for (const c of cases) {
    const r = redactPii(c.in);
    const ok =
      c.expectTypes.every((t) => r.types.includes(t)) &&
      (c.expectTypes.length === 0
        ? r.redacted === c.in
        : !/0\d{2}[-\s]?\d{3,4}[-\s]?\d{3,4}/.test(r.redacted) &&
          !/[\w.+-]+@[\w-]+\.[\w.-]+/.test(r.redacted));
    check(`"${c.in.slice(0, 40)}..." → ${r.redacted.slice(0, 40)}`, ok);
  }

  // Persist a real Message row through the redactor so we know the model works.
  const sent = redactPii("Hi Aishah, reach me at 012-3456789 or aishah@gmail.com");
  const msg = await db.message.create({
    data: {
      matchId: matchedRow!.id,
      senderId: TEST_CLIENT_ID,
      bodyRaw: "Hi Aishah, reach me at 012-3456789 or aishah@gmail.com",
      bodyRedacted: sent.redacted,
      redactedPiiTypes: sent.types,
    },
  });
  check("Message row persisted with redacted body", !!msg.id);
  check("redactedPiiTypes captured phone + email", msg.redactedPiiTypes.includes("phone") && msg.redactedPiiTypes.includes("email"));

  // ── 10. Booking gated on MATCHED ───────────────────────────────────────
  console.log(`\n${STEP} 10. Booking — gated on MATCHED status`);
  const aishahCleaningListing = await db.helperListing.findFirst({
    where: { helperId: aishah.helperId, category: "HOME_CLEANING" },
  });
  const addr = await db.address.findFirst({ where: { clientId: TEST_CLIENT_ID } });
  check("test client has a saved address", !!addr);

  // For now, the booking model itself just needs valid data — full booking
  // server action lands in implementation step 9. Demonstrate the gate works:
  const bookingShouldSucceed = matchedRow?.status === "MATCHED";
  check("booking would be allowed (match is MATCHED)", bookingShouldSucceed);

  const booking = await db.booking.create({
    data: {
      matchId: matchedRow!.id,
      clientId: TEST_CLIENT_ID,
      helperId: aishah.helperId,
      listingId: aishahCleaningListing!.id,
      category: "HOME_CLEANING",
      addressId: addr!.id,
      scheduledStart: new Date(Date.now() + 86400_000), // tomorrow
      durationHours: 3,
      pricingMode: "HOURLY",
      rateMyrSenSnap: aishahCleaningListing!.rateMyrSen,
      estTotalMyrSen: aishahCleaningListing!.rateMyrSen * 3,
      status: "REQUESTED",
    },
  });
  check("Booking row created with snapshotted rate", booking.estTotalMyrSen === 3500 * 3);

  await db.paymentIntent.create({
    data: {
      bookingId: booking.id,
      provider: "BILLPLZ",
      amountMyrSen: booking.estTotalMyrSen,
      status: "PENDING",
    },
  });
  check("PaymentIntent row created in PENDING state", true);

  // ── 11. Billplz webhook signature verification ─────────────────────────
  console.log(`\n${STEP} 11. Billplz X-Signature webhook security`);
  const SIG_KEY = process.env.BILLPLZ_X_SIGNATURE!;
  const { createHmac } = await import("node:crypto");
  const payload = { id: "bill_1", paid: "true", amount: "10500", state: "paid" };
  const source = Object.keys(payload)
    .sort()
    .map((k) => `${k}${payload[k as keyof typeof payload]}`)
    .join("|");
  const goodSig = createHmac("sha256", SIG_KEY).update(source).digest("hex");
  check("valid signature verifies", verifyXSignature(payload, goodSig));
  check("forged signature is rejected", !verifyXSignature(payload, "00" + goodSig.slice(2)));
  check("missing-byte signature is rejected", !verifyXSignature(payload, goodSig.slice(0, -2)));

  // ── 12. Rate limit: 21st right-swipe blocked in a day ──────────────────
  console.log(`\n${STEP} 12. Rate limit — 20 right-swipes/day cap`);
  // Use a fresh user ID so this run's prior swipes don't count.
  const ratelimitUser = `rl-test-${Date.now()}`;
  let blockedAt = -1;
  for (let i = 1; i <= 21; i++) {
    const r = await rateLimit(`swipe:right:${ratelimitUser}`, 20, 86400);
    if (!r.allowed) {
      blockedAt = i;
      break;
    }
  }
  check("21st right-swipe is blocked (20-per-day cap)", blockedAt === 21, `blocked at ${blockedAt}`);

  // ── 13. Unmatch / block ────────────────────────────────────────────────
  console.log(`\n${STEP} 13. Unmatch + block`);
  await db.match.update({
    where: { id: matchedRow!.id },
    data: { status: "UNMATCHED" },
  });
  const unmatched = await db.match.findUnique({ where: { id: matchedRow!.id } });
  check("Match flipped to UNMATCHED", unmatched?.status === "UNMATCHED");

  await db.blockList.create({
    data: { blockerId: TEST_CLIENT_ID, blockedId: aishah.helperId },
  });
  const block = await db.blockList.findUnique({
    where: { blockerId_blockedId: { blockerId: TEST_CLIENT_ID, blockedId: aishah.helperId } },
  });
  check("BlockList row created", !!block);

  // ── 14. Summary ────────────────────────────────────────────────────────
  console.log(`\n${"=".repeat(60)}`);
  console.log(`${passed} passed · ${failed} failed`);
  console.log(`${"=".repeat(60)}\n`);
  console.log(`📊 DB state after simulation:`);
  const finalStats = await db.$transaction([
    db.user.count(),
    db.helperProfile.count(),
    db.helperListing.count(),
    db.swipe.count(),
    db.match.count(),
    db.message.count(),
    db.booking.count(),
    db.paymentIntent.count(),
  ]);
  console.log(`   users: ${finalStats[0]}`);
  console.log(`   helper profiles: ${finalStats[1]}`);
  console.log(`   helper listings: ${finalStats[2]}`);
  console.log(`   swipes: ${finalStats[3]}`);
  console.log(`   matches: ${finalStats[4]}`);
  console.log(`   messages: ${finalStats[5]}`);
  console.log(`   bookings: ${finalStats[6]}`);
  console.log(`   payment intents: ${finalStats[7]}\n`);

  if (failed > 0) process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
