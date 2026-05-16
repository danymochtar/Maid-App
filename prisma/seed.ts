import { PrismaClient, ServiceCategory } from "@prisma/client";

const db = new PrismaClient();

// Seed produces a non-empty swipe stack for every category enabled at MVP.
async function main() {
  await db.helperListing.deleteMany();
  await db.helperProfile.deleteMany();
  await db.clientProfile.deleteMany();
  await db.user.deleteMany();

  const admin = await db.user.create({
    data: {
      phoneE164: "+60111000001",
      role: "ADMIN",
      status: "ACTIVE",
      verifTier: "TIER_2_BG_CHECK",
    },
  });

  const client = await db.user.create({
    data: {
      phoneE164: "+60111000002",
      role: "CLIENT",
      status: "ACTIVE",
      clientProfile: {
        create: {
          fullName: "Test Client",
          addresses: {
            create: {
              line1: "Jalan Bukit Bintang",
              city: "Kuala Lumpur",
              state: "WP",
              postcode: "50000",
              lat: 3.146,
              lng: 101.71,
            },
          },
        },
      },
    },
    include: { clientProfile: true },
  });

  const helpers = [
    {
      name: "Aishah",
      tagline: "Detail-oriented, 5+ years cleaning condos in KL",
      categories: [
        { c: "HOME_CLEANING" as ServiceCategory, rate: 3500, mode: "HOURLY" as const, skills: ["deep clean", "pet-friendly"] },
        { c: "HOME_LAUNDRY" as ServiceCategory, rate: 2500, mode: "HOURLY" as const, skills: ["delicates"] },
      ],
    },
    {
      name: "Hafiz",
      tagline: "Errand expert — your time is mine",
      categories: [
        { c: "ERRANDS_GROCERY" as ServiceCategory, rate: 3000, mode: "PER_JOB" as const, skills: ["NSK", "Mydin"] },
        { c: "ERRANDS_PARCEL" as ServiceCategory, rate: 2000, mode: "PER_JOB" as const, skills: [] },
      ],
    },
    {
      name: "Mei Ling",
      tagline: "Home cook — Cantonese & Nyonya",
      categories: [
        { c: "HOME_COOKING" as ServiceCategory, rate: 6000, mode: "PER_JOB" as const, skills: ["meal prep", "halal-aware"] },
      ],
    },
    {
      name: "Priya",
      tagline: "Pet sitter + dog walker",
      categories: [
        { c: "CARE_PET" as ServiceCategory, rate: 2500, mode: "HOURLY" as const, skills: ["dogs", "cats"] },
        { c: "CARE_PLANT" as ServiceCategory, rate: 2000, mode: "PER_JOB" as const, skills: [] },
      ],
    },
    {
      name: "Daniel",
      tagline: "Tutor — Maths/Add Maths SPM",
      categories: [
        { c: "TUTORING" as ServiceCategory, rate: 5000, mode: "HOURLY" as const, skills: ["SPM Maths", "Add Maths"] },
      ],
    },
    {
      name: "Siti",
      tagline: "Personal assistant — admin & errands",
      categories: [
        { c: "PERSONAL_ASSISTANT" as ServiceCategory, rate: 4000, mode: "HOURLY" as const, skills: ["scheduling", "BM/EN"] },
        { c: "EVENT_HELP" as ServiceCategory, rate: 8000, mode: "PER_JOB" as const, skills: ["kenduri prep"] },
      ],
    },
    {
      name: "Ravi",
      tagline: "Handy fixes & IKEA assembly",
      categories: [
        { c: "HANDY_SMALL" as ServiceCategory, rate: 4500, mode: "PER_JOB" as const, skills: ["IKEA", "shelves"] },
      ],
    },
    {
      name: "Nurul",
      tagline: "Home organizer — Marie-Kondo style",
      categories: [
        { c: "HOME_ORGANIZING" as ServiceCategory, rate: 4000, mode: "HOURLY" as const, skills: ["wardrobe", "kitchen"] },
      ],
    },
  ];

  for (const [i, h] of helpers.entries()) {
    const u = await db.user.create({
      data: {
        phoneE164: `+6011200${String(i).padStart(4, "0")}`,
        role: "HELPER",
        status: "ACTIVE",
        helperProfile: {
          create: {
            displayName: h.name,
            tagline: h.tagline,
            bio: `${h.name} — verified pembantu in KL.`,
            photoUrls: [],
            serviceAreas: ["50", "51", "52", "53"],
            baseLat: 3.14 + Math.random() * 0.05,
            baseLng: 101.69 + Math.random() * 0.05,
            radiusKm: 15,
            ratingAvg: 4.4 + Math.random() * 0.5,
            ratingCount: Math.floor(Math.random() * 80) + 5,
            completedJobs: Math.floor(Math.random() * 120) + 3,
            acceptanceRate: 0.7 + Math.random() * 0.3,
          },
        },
      },
    });

    for (const cat of h.categories) {
      await db.helperListing.create({
        data: {
          helperId: u.id,
          category: cat.c,
          pricingMode: cat.mode,
          rateMyrSen: cat.rate,
          minHours: cat.mode === "HOURLY" ? 2 : null,
          jobDurationMins: cat.mode === "PER_JOB" ? 90 : null,
          skills: cat.skills,
        },
      });
    }
  }

  console.log(
    `Seeded: 1 admin (${admin.id}), 1 client (${client.id}, postcode 50000), ${helpers.length} helpers across categories.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
