import type { PrismaClient, ServiceCategory } from "@prisma/client";
import { PrismaClient as PrismaClientCtor } from "@prisma/client";
import { hashPassword } from "../lib/passwords";
import { TEST_CLIENT_ID, TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD } from "../lib/dev-session";

// 10 helpers spanning all MVP-enabled categories with distinct personalities,
// pricing modes, ratings, and skills so the swipe stack has visible variety.
const HELPER_PASSWORD = "helper123";

const HELPERS = [
  {
    phone: "+60112000001",
    email: "aishah@maidapp.ai",
    name: "Aishah",
    tagline: "Detail-oriented condo cleaner, 5+ years in KL",
    bio: "Verified pembantu. Bring my own eco-friendly supplies. Pet-friendly homes welcome.",
    rating: 4.9,
    ratingCount: 84,
    jobs: 142,
    listings: [
      { c: "HOME_CLEANING", rate: 3500, mode: "HOURLY", skills: ["deep clean", "pet-friendly", "eco supplies"], minHours: 2 },
      { c: "HOME_LAUNDRY", rate: 2500, mode: "HOURLY", skills: ["delicates", "ironing"], minHours: 1 },
    ],
  },
  {
    phone: "+60112000002",
    email: "hafiz@maidapp.ai",
    name: "Hafiz",
    tagline: "Errand expert — your time is mine",
    bio: "Have car + motorbike. Cover KL & Selangor. Fast, reliable, photo proof for every parcel.",
    rating: 4.7,
    ratingCount: 56,
    jobs: 89,
    listings: [
      { c: "ERRANDS_GROCERY", rate: 3000, mode: "PER_JOB", skills: ["NSK", "Mydin", "wet market"], jobMins: 90 },
      { c: "ERRANDS_PARCEL", rate: 2000, mode: "PER_JOB", skills: ["Pos Laju", "DHL", "courier"], jobMins: 45 },
      { c: "ERRANDS_PHARMACY", rate: 2500, mode: "PER_JOB", skills: ["Guardian", "Watsons"], jobMins: 45 },
    ],
  },
  {
    phone: "+60112000003",
    email: "meiling@maidapp.ai",
    name: "Mei Ling",
    tagline: "Home cook — Cantonese & Nyonya specialty",
    bio: "Trained at Berjaya UCSI. Cook 4-course meals on-site. Halal-aware kitchen handling.",
    rating: 4.95,
    ratingCount: 41,
    jobs: 67,
    listings: [
      { c: "HOME_COOKING", rate: 6000, mode: "PER_JOB", skills: ["meal prep", "halal-aware", "Cantonese", "Nyonya"], jobMins: 180 },
    ],
  },
  {
    phone: "+60112000004",
    email: "priya@maidapp.ai",
    name: "Priya",
    tagline: "Pet sitter + dog walker, vet-tech trained",
    bio: "Worked at PetWorld 3 years. Comfortable with dogs (any size), cats, rabbits, hamsters.",
    rating: 4.8,
    ratingCount: 73,
    jobs: 108,
    listings: [
      { c: "CARE_PET", rate: 2500, mode: "HOURLY", skills: ["dogs", "cats", "rabbits", "vet-tech"], minHours: 1 },
      { c: "CARE_PLANT", rate: 2000, mode: "PER_JOB", skills: ["watering", "indoor plants"], jobMins: 60 },
    ],
  },
  {
    phone: "+60112000005",
    email: "daniel@maidapp.ai",
    name: "Daniel",
    tagline: "SPM Maths & Add Maths tutor, 8 years",
    bio: "Engineering grad UTM. SPM A+ Maths. Teach in BM or EN. Past students up 2 grades on avg.",
    rating: 4.85,
    ratingCount: 29,
    jobs: 52,
    listings: [
      { c: "TUTORING", rate: 5000, mode: "HOURLY", skills: ["SPM Maths", "Add Maths", "BM", "EN"], minHours: 1 },
    ],
  },
  {
    phone: "+60112000006",
    email: "siti@maidapp.ai",
    name: "Siti",
    tagline: "Personal assistant — admin, scheduling, errands",
    bio: "Ex-administrative officer. Manage your inbox, schedule calls, draft emails (BM/EN/Mandarin).",
    rating: 4.6,
    ratingCount: 18,
    jobs: 31,
    listings: [
      { c: "PERSONAL_ASSISTANT", rate: 4000, mode: "HOURLY", skills: ["scheduling", "BM/EN/Mandarin", "inbox management"], minHours: 2 },
      { c: "EVENT_HELP", rate: 8000, mode: "PER_JOB", skills: ["kenduri prep", "decorations"], jobMins: 240 },
    ],
  },
  {
    phone: "+60112000007",
    email: "ravi@maidapp.ai",
    name: "Ravi",
    tagline: "Handy fixes & IKEA assembly — tools included",
    bio: "Carpenter background. Hang shelves, mount TVs, assemble any IKEA flatpack. Insured.",
    rating: 4.75,
    ratingCount: 47,
    jobs: 79,
    listings: [
      { c: "HANDY_SMALL", rate: 4500, mode: "PER_JOB", skills: ["IKEA", "shelves", "TV mount", "drilling"], jobMins: 90 },
    ],
  },
  {
    phone: "+60112000008",
    email: "nurul@maidapp.ai",
    name: "Nurul",
    tagline: "Home organizer — Marie-Kondo certified",
    bio: "Categorize, declutter, label. Wardrobe, kitchen, pantry, garage. Photos before/after.",
    rating: 4.9,
    ratingCount: 22,
    jobs: 33,
    listings: [
      { c: "HOME_ORGANIZING", rate: 4000, mode: "HOURLY", skills: ["wardrobe", "kitchen", "Marie-Kondo"], minHours: 3 },
    ],
  },
  {
    phone: "+60112000009",
    email: "kumar@maidapp.ai",
    name: "Kumar",
    tagline: "Queue stand-in & document pickup",
    bio: "Stand in line at JPJ, JPN, Imigresen, banks. Send live photo updates while queuing.",
    rating: 4.65,
    ratingCount: 12,
    jobs: 24,
    listings: [
      { c: "ERRANDS_QUEUE", rate: 3500, mode: "PER_JOB", skills: ["JPJ", "JPN", "Imigresen", "live updates"], jobMins: 120 },
    ],
  },
  {
    phone: "+60112000010",
    email: "farah@maidapp.ai",
    name: "Farah",
    tagline: "Multi-tasker — cleaning, laundry, cooking combo",
    bio: "Save by booking me for the day. Light meal prep + cleaning + laundry in one visit.",
    rating: 4.7,
    ratingCount: 38,
    jobs: 61,
    listings: [
      { c: "HOME_CLEANING", rate: 3200, mode: "HOURLY", skills: ["combo bookings", "general clean"], minHours: 3 },
      { c: "HOME_COOKING", rate: 4500, mode: "PER_JOB", skills: ["Malay home cooking", "meal prep"], jobMins: 120 },
      { c: "HOME_LAUNDRY", rate: 2200, mode: "HOURLY", skills: ["wash", "fold"], minHours: 1 },
    ],
  },
] as const;

export type SeedLog = (msg: string) => void;

export async function seedDatabase(db: PrismaClient, log: SeedLog = console.log) {
  log("⏳ Cleaning slate...");
  await db.message.deleteMany();
  await db.review.deleteMany();
  await db.dispute.deleteMany();
  await db.paymentIntent.deleteMany();
  await db.booking.deleteMany();
  await db.match.deleteMany();
  await db.swipe.deleteMany();
  await db.helperListing.deleteMany();
  await db.helperProfile.deleteMany();
  await db.address.deleteMany();
  await db.clientProfile.deleteMany();
  await db.report.deleteMany();
  await db.blockList.deleteMany();
  await db.auditLog.deleteMany();
  await db.deviceFingerprint.deleteMany();
  await db.oTPAttempt.deleteMany();
  await db.user.deleteMany();

  log("⏳ Seeding admin...");
  const admin = await db.user.create({
    data: {
      phoneE164: "+60111000001",
      email: "admin@maidapp.ai",
      passwordHash: hashPassword("admin123"),
      role: "ADMIN",
      status: "ACTIVE",
      verifTier: "TIER_2_BG_CHECK",
    },
  });

  log(`⏳ Seeding test client (${TEST_CLIENT_EMAIL} / ${TEST_CLIENT_PASSWORD})...`);
  await db.user.create({
    data: {
      id: TEST_CLIENT_ID,
      phoneE164: "+60123456789",
      email: TEST_CLIENT_EMAIL,
      passwordHash: hashPassword(TEST_CLIENT_PASSWORD),
      role: "CLIENT",
      status: "ACTIVE",
      verifTier: "TIER_0_PHONE",
      clientProfile: {
        create: {
          fullName: "Test Customer",
          addresses: {
            create: {
              line1: "Jalan Bukit Bintang 123",
              line2: "Unit 5-1",
              city: "Kuala Lumpur",
              state: "WP",
              postcode: "50000",
              lat: 3.146,
              lng: 101.71,
              notes: "Lift in lobby on left",
            },
          },
        },
      },
    },
  });

  log("⏳ Seeding 10 helpers...");
  for (const [i, h] of HELPERS.entries()) {
    const u = await db.user.create({
      data: {
        phoneE164: h.phone,
        email: h.email,
        passwordHash: hashPassword(HELPER_PASSWORD),
        role: "HELPER",
        status: "ACTIVE",
        verifTier: "TIER_0_PHONE",
        helperProfile: {
          create: {
            displayName: h.name,
            tagline: h.tagline,
            bio: h.bio,
            photoUrls: [],
            serviceAreas: ["50", "51", "52", "53", "54"],
            baseLat: 3.13 + (i * 0.01),
            baseLng: 101.68 + (i * 0.01),
            radiusKm: 15,
            ratingAvg: h.rating,
            ratingCount: h.ratingCount,
            completedJobs: h.jobs,
            acceptanceRate: 0.7 + (i % 4) * 0.075,
            responseMedianMins: 10 + (i * 3),
          },
        },
      },
    });

    for (const l of h.listings) {
      await db.helperListing.create({
        data: {
          helperId: u.id,
          category: l.c as ServiceCategory,
          pricingMode: l.mode as "HOURLY" | "PER_JOB",
          rateMyrSen: l.rate,
          minHours: "minHours" in l ? l.minHours : null,
          jobDurationMins: "jobMins" in l ? l.jobMins : null,
          skills: [...l.skills],
          active: true,
        },
      });
    }
  }

  const stats = await db.$transaction([
    db.user.count({ where: { role: "HELPER" } }),
    db.helperListing.count(),
    db.user.count({ where: { role: "CLIENT" } }),
  ]);
  log(
    `✅ Seed done. Helpers: ${stats[0]}, Listings: ${stats[1]}, Clients: ${stats[2]}, Admin: ${admin.id}`,
  );
  log(`\n👉 Test customer login: ${TEST_CLIENT_EMAIL} / ${TEST_CLIENT_PASSWORD}`);
  log(`👉 Helper logins (password: ${HELPER_PASSWORD}):`);
  for (const h of HELPERS) log(`     ${h.email}  (${h.name})`);

  return {
    helpers: HELPERS.length,
    listings: stats[1],
    clients: stats[2],
    admin: admin.id,
  };
}

// CLI entry — only when invoked directly via `tsx prisma/seed.ts`.
const isCli = typeof require !== "undefined"
  ? require.main === module
  : (() => {
      try {
        return import.meta.url === `file://${process.argv[1]}`;
      } catch {
        return false;
      }
    })();

if (isCli) {
  const db = new PrismaClientCtor();
  seedDatabase(db)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => db.$disconnect());
}
