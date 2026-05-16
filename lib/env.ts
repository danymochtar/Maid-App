import { z } from "zod";

const flag = z.preprocess((v) => v === "true" || v === "1", z.boolean());

const schema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_VERIFY_SID: z.string().optional(),
  TWILIO_LOOKUP_ENABLED: flag.default(false),
  BILLPLZ_API_KEY: z.string().optional(),
  BILLPLZ_COLLECTION_ID: z.string().optional(),
  BILLPLZ_X_SIGNATURE: z.string().optional(),
  BILLPLZ_API_BASE: z.string().url().default("https://www.billplz-sandbox.com/api/v3"),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  PUSHER_APP_ID: z.string().optional(),
  PUSHER_KEY: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  PUSHER_CLUSTER: z.string().default("ap1"),
  RESEND_API_KEY: z.string().optional(),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  ADMIN_BOOTSTRAP_PHONES: z.string().default(""),
  FEATURE_CHILDCARE_ENABLED: flag.default(false),
  FEATURE_ELDERCARE_ENABLED: flag.default(false),
  FEATURE_DRIVER_ENABLED: flag.default(false),
  FEATURE_BEAUTY_WELLNESS_ENABLED: flag.default(false),
  FEATURE_SUPERLIKE_ENABLED: flag.default(true),
  DEV_OTP_BYPASS: flag.default(false),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = schema.parse(process.env);

export const adminBootstrapPhones = env.ADMIN_BOOTSTRAP_PHONES.split(",")
  .map((p) => p.trim())
  .filter(Boolean);

export function isCategoryEnabled(category: string) {
  if (category === "CARE_CHILD") return env.FEATURE_CHILDCARE_ENABLED;
  if (category === "CARE_ELDER") return env.FEATURE_ELDERCARE_ENABLED;
  if (category === "DRIVER_ONDEMAND") return env.FEATURE_DRIVER_ENABLED;
  if (category === "BEAUTY_WELLNESS") return env.FEATURE_BEAUTY_WELLNESS_ENABLED;
  return true;
}
