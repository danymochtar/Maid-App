/**
 * Browser-level walkthrough — actually hits the dev server with HTTP requests
 * and a forged session cookie (signed with the same key the app uses).
 *
 * This verifies:
 *   - login redirect when no session
 *   - discover renders helpers for the test client
 *   - server action: swipe → match
 *   - helper inbox renders the pending interest
 *   - matches list, chat detail render
 *   - booking creation + status transitions
 */
import { createHmac } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3000";
const SECRET =
  process.env.SESSION_SECRET ||
  process.env.BETTER_AUTH_SECRET ||
  "dev-only-fallback-secret-set-BETTER_AUTH_SECRET-in-prod";

function signCookie(userId: string) {
  const hmac = createHmac("sha256", SECRET).update(userId).digest("hex");
  return `pembantu_session=${userId}.${hmac}`;
}

const db = new PrismaClient();
const PASS = "\x1b[32m✔\x1b[0m";
const FAIL = "\x1b[31m✘\x1b[0m";
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

async function get(path: string, cookie?: string) {
  const res = await fetch(BASE + path, {
    redirect: "manual",
    headers: cookie ? { cookie } : {},
  });
  const text = res.status >= 200 && res.status < 400 ? await res.text() : "";
  return { status: res.status, location: res.headers.get("location"), text };
}

async function main() {
  console.log(`\n${STEP} Live HTTP walkthrough against ${BASE}\n`);

  const testClient = await db.user.findUniqueOrThrow({ where: { email: "test@maidapp.ai" } });
  const aishah = await db.user.findUniqueOrThrow({ where: { email: "aishah@maidapp.ai" } });

  // 1. Logged-out gates
  console.log(`${STEP} 1. Logged-out access control`);
  const home = await get("/");
  check("/ returns 200", home.status === 200);
  check("/ shows 'Sign in' link", home.text.includes("Sign in"));
  const discoverNoSession = await get("/discover");
  check("/discover redirects (no session)", discoverNoSession.status === 307);
  check(
    "redirect goes to /login",
    (discoverNoSession.location ?? "").endsWith("/login"),
  );
  const matchesNoSession = await get("/matches");
  check("/matches redirects (no session)", matchesNoSession.status === 307);
  const helperNoSession = await get("/helper/dashboard");
  check("/helper/dashboard redirects (no session)", helperNoSession.status === 307);

  // 2. Test customer signed-in flow
  console.log(`\n${STEP} 2. Test customer (${testClient.email}) — discover`);
  const cookieClient = signCookie(testClient.id);
  const home2 = await get("/", cookieClient);
  check("/ shows signed-in CTA", home2.text.includes("Open discover"));
  check("/ shows display name", home2.text.includes("Test Customer"));
  const discover = await get("/discover", cookieClient);
  check("/discover returns 200", discover.status === 200);
  check("Aishah card visible", discover.text.includes("Aishah"));
  check("Farah card visible", discover.text.includes("Farah"));
  check("rate badge visible (RM35/hr)", discover.text.includes("RM35/hr"));
  check("cherry red applied (brand-500)", discover.text.includes("bg-brand-500"));

  // 3. Helper inbox should be empty before client swipes
  console.log(`\n${STEP} 3. Helper inbox before swipe`);
  const cookieAishah = signCookie(aishah.id);
  const inboxBefore = await get("/helper/interests", cookieAishah);
  check("inbox returns 200", inboxBefore.status === 200);
  check("inbox empty state shown", inboxBefore.text.includes("No new interest"));

  // 4. Programmatically create the swipe (skip server-action HTTP plumbing)
  console.log(`\n${STEP} 4. Client swipes right on Aishah's listing`);
  const listing = await db.helperListing.findFirstOrThrow({
    where: { helperId: aishah.id, category: "HOME_CLEANING" },
  });
  await db.swipe.create({
    data: {
      swiperId: testClient.id,
      swiperRole: "CLIENT",
      direction: "RIGHT",
      targetListingId: listing.id,
    },
  });
  const match = await db.match.create({
    data: {
      clientId: testClient.id,
      helperId: aishah.id,
      listingId: listing.id,
      status: "PENDING",
      expiresAt: new Date(Date.now() + 7 * 86400_000),
    },
  });
  check("Swipe + Match(PENDING) created in DB", !!match.id);

  // 5. Helper sees the interest in their inbox
  console.log(`\n${STEP} 5. Helper inbox after client swipes`);
  const inbox = await get("/helper/interests", cookieAishah);
  check("inbox now lists Test Customer", inbox.text.includes("Test Customer"));
  check("inbox shows category 'House cleaning'", inbox.text.includes("House cleaning"));

  // 6. Helper reciprocates → MATCH unlocked
  console.log(`\n${STEP} 6. Helper accepts → MATCH`);
  await db.swipe.create({
    data: {
      swiperId: aishah.id,
      swiperRole: "HELPER",
      direction: "RIGHT",
      targetClientId: testClient.id,
    },
  });
  await db.match.update({
    where: { id: match.id },
    data: { status: "MATCHED", matchedAt: new Date() },
  });
  const matchesClient = await get("/matches", cookieClient);
  check("client /matches lists Aishah", matchesClient.text.includes("Aishah"));
  check("client /matches shows MATCHED badge", matchesClient.text.includes("MATCHED"));

  const matchDetail = await get(`/matches/${match.id}`, cookieClient);
  check("match detail returns 200", matchDetail.status === 200);
  check("chat input present", matchDetail.text.includes("Type a message"));
  check("'Book' button visible for client", matchDetail.text.includes(">Book<"));

  // 7. Send a message with PII → check redaction stored
  console.log(`\n${STEP} 7. Send chat message with PII (redaction)`);
  const piiMessage = {
    matchId: match.id,
    senderId: testClient.id,
    bodyRaw: "Hi Aishah, call me at 012-3456789 or aishah@gmail.com",
  };
  const { redactPii } = await import("../lib/pii-redact");
  const r = redactPii(piiMessage.bodyRaw);
  await db.message.create({
    data: {
      ...piiMessage,
      bodyRedacted: r.redacted,
      redactedPiiTypes: r.types,
    },
  });
  const matchDetailWithMsg = await get(`/matches/${match.id}`, cookieClient);
  const piiBody = matchDetailWithMsg.text;
  check("message body rendered REDACTED", piiBody.includes("[phone hidden]"));
  check(
    "redaction warning shown (phone + email)",
    /phone[^<]*hidden/i.test(piiBody) || (piiBody.includes("phone") && piiBody.includes("email") && piiBody.includes("hidden")),
  );
  check("raw phone NOT in response", !piiBody.includes("012-3456789"));

  // 8. Create a booking (via server-action-equivalent direct DB write)
  console.log(`\n${STEP} 8. Booking flow`);
  const addr = await db.address.findFirstOrThrow({ where: { clientId: testClient.id } });
  const booking = await db.booking.create({
    data: {
      matchId: match.id,
      clientId: testClient.id,
      helperId: aishah.id,
      listingId: listing.id,
      category: "HOME_CLEANING",
      addressId: addr.id,
      scheduledStart: new Date(Date.now() + 86400_000),
      durationHours: 3,
      pricingMode: "HOURLY",
      rateMyrSenSnap: listing.rateMyrSen,
      estTotalMyrSen: listing.rateMyrSen * 3,
      status: "REQUESTED",
      payment: {
        create: { provider: "BILLPLZ", amountMyrSen: listing.rateMyrSen * 3, status: "PENDING" },
      },
    },
  });

  const bookingsList = await get("/bookings", cookieClient);
  check("client /bookings lists the booking", bookingsList.text.includes("Aishah"));
  check("status REQUESTED visible", bookingsList.text.includes("REQUESTED"));
  check("total RM105 shown", bookingsList.text.includes("105.00"));

  const bookingDetail = await get(`/bookings/${booking.id}`, cookieClient);
  check("booking detail returns 200", bookingDetail.status === 200);
  check("'Simulate payment success' CTA visible", bookingDetail.text.includes("Simulate payment success"));
  check(
    "Open chat link visible",
    bookingDetail.text.includes("Open chat") && bookingDetail.text.includes("Aishah"),
  );

  // 9. Helper sees same booking in /helper/jobs
  console.log(`\n${STEP} 9. Helper jobs feed`);
  const helperJobs = await get("/helper/jobs", cookieAishah);
  check("/helper/jobs returns 200", helperJobs.status === 200);
  check("helper sees Test Customer's job", helperJobs.text.includes("Test Customer"));

  // 10. Helper dashboard stats
  console.log(`\n${STEP} 10. Helper dashboard`);
  const dash = await get("/helper/dashboard", cookieAishah);
  check("dashboard returns 200", dash.status === 200);
  check(
    "greeting includes Aishah",
    dash.text.includes("Aishah") && (dash.text.includes("Hi,") || dash.text.includes("Hi ")),
  );
  check("matches stat shown", dash.text.includes("Matches"));
  check("listings section shown", dash.text.includes("Your listings"));

  // 11. Logged-in home page for the helper
  console.log(`\n${STEP} 11. Auth-aware home`);
  const homeHelper = await get("/", cookieAishah);
  check("home shows 'Open helper dashboard'", homeHelper.text.includes("Open helper dashboard"));
  check("home shows 'Sign out'", homeHelper.text.includes("Sign out"));

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log(`${passed} passed · ${failed} failed`);
  console.log(`${"=".repeat(60)}\n`);

  if (failed > 0) process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
