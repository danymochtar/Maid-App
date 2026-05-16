import { env } from "./env";

// Minimal Twilio Verify wrapper. Real Twilio SDK is imported lazily so
// `DEV_OTP_BYPASS=1` works without credentials configured.

export async function sendOtp(phoneE164: string): Promise<{ ok: true; bypass?: boolean }> {
  if (env.DEV_OTP_BYPASS && env.NODE_ENV !== "production") {
    console.warn(`[otp] DEV_OTP_BYPASS active — code is 000000 for ${phoneE164}`);
    return { ok: true, bypass: true };
  }
  const { default: twilio } = await import("twilio");
  const client = twilio(env.TWILIO_ACCOUNT_SID!, env.TWILIO_AUTH_TOKEN!);
  await client.verify.v2.services(env.TWILIO_VERIFY_SID!).verifications.create({
    to: phoneE164,
    channel: "sms",
  });
  return { ok: true };
}

export async function verifyOtp(
  phoneE164: string,
  code: string,
): Promise<{ ok: boolean }> {
  if (env.DEV_OTP_BYPASS && env.NODE_ENV !== "production") {
    return { ok: code === "000000" };
  }
  const { default: twilio } = await import("twilio");
  const client = twilio(env.TWILIO_ACCOUNT_SID!, env.TWILIO_AUTH_TOKEN!);
  const check = await client.verify.v2
    .services(env.TWILIO_VERIFY_SID!)
    .verificationChecks.create({ to: phoneE164, code });
  return { ok: check.status === "approved" };
}

export async function isVoipNumber(phoneE164: string): Promise<boolean> {
  if (!env.TWILIO_LOOKUP_ENABLED) return false;
  if (env.DEV_OTP_BYPASS && env.NODE_ENV !== "production") return false;
  const { default: twilio } = await import("twilio");
  const client = twilio(env.TWILIO_ACCOUNT_SID!, env.TWILIO_AUTH_TOKEN!);
  const lookup = await client.lookups.v2
    .phoneNumbers(phoneE164)
    .fetch({ fields: "line_type_intelligence" });
  const lineType = lookup.lineTypeIntelligence?.type;
  return lineType === "voip" || lineType === "nonFixedVoip";
}
