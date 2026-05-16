import { PricingMode, ServiceCategory } from "@prisma/client";
import { z } from "zod";

const BANNED_TERMS = [
  "escort",
  "massage happy",
  "happy ending",
  "adult service",
  "sex",
  "drug",
  "weapon",
  "gun",
];

export const skillSchema = z
  .string()
  .min(2)
  .max(40)
  .refine((s) => !BANNED_TERMS.some((b) => s.toLowerCase().includes(b)), {
    message: "Contains a banned term",
  });

export const listingInputSchema = z
  .object({
    category: z.nativeEnum(ServiceCategory),
    pricingMode: z.nativeEnum(PricingMode),
    rateMyrSen: z.number().int().min(500).max(100_000),
    minHours: z.number().int().min(1).max(12).nullable().optional(),
    jobDurationMins: z.number().int().min(15).max(720).nullable().optional(),
    skills: z.array(skillSchema).max(8).default([]),
    requirements: z.string().max(280).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.pricingMode === "HOURLY" && !v.minHours) {
      ctx.addIssue({ code: "custom", message: "minHours required for hourly", path: ["minHours"] });
    }
    if (v.pricingMode === "PER_JOB" && !v.jobDurationMins) {
      ctx.addIssue({
        code: "custom",
        message: "jobDurationMins required for per-job",
        path: ["jobDurationMins"],
      });
    }
  });

export type ListingInput = z.infer<typeof listingInputSchema>;
