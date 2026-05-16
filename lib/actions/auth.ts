"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "../db";
import { hashPassword, verifyPassword } from "../passwords";
import { rateLimit } from "../rate-limit";
import { clearSession, setSession } from "../session";
import { sendOtp, verifyOtp } from "../twilio";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type AuthState = { error?: string; ok?: boolean; info?: string };

export async function loginAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").toLowerCase().trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { error: "Email and password required" };

  try {
    const rl = await rateLimit(`login:${parsed.data.email}`, 10, 300);
    if (!rl.allowed) return { error: "Too many attempts. Try again in 5 minutes." };

    const user = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, passwordHash: true, status: true, role: true },
    });
    if (!user || !user.passwordHash || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return { error: "Invalid email or password" };
    }
    if (user.status === "BANNED" || user.status === "SUSPENDED") {
      return { error: "Account locked. Contact support." };
    }

    await setSession(user.id);
    redirect(user.role === "HELPER" ? "/helper/dashboard" : "/discover");
  } catch (e) {
    // `redirect()` throws a special signal — let Next.js handle it.
    if (e && typeof e === "object" && "digest" in e) throw e;
    console.error("[loginAction]", e);
    return {
      error:
        "Login service is unavailable — the database isn't configured on this deployment yet.",
    };
  }
}

// Register step 1: phone → OTP sent.
const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+60\d{8,11}$/, "Phone must be +60 followed by 8-11 digits"),
});

export async function sendOtpAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = sendOtpSchema.safeParse({ phone: String(formData.get("phone") ?? "").trim() });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const rl = await rateLimit(`otp:${parsed.data.phone}`, 3, 86400);
    if (!rl.allowed) return { error: "OTP limit reached for this number today" };

    await sendOtp(parsed.data.phone);
    return {
      ok: true,
      info:
        process.env.DEV_OTP_BYPASS === "1" || process.env.DEV_OTP_BYPASS === "true"
          ? "Dev mode: code is 000000"
          : "Code sent to your phone",
    };
  } catch (e) {
    console.error("[sendOtpAction]", e);
    return { error: "OTP service unavailable. Set TWILIO_* env vars or DEV_OTP_BYPASS=1." };
  }
}

// Register step 2: phone + OTP + name + role + email + password → create user + session.
const registerSchema = z.object({
  phone: z.string().regex(/^\+60\d{8,11}$/),
  code: z.string().regex(/^\d{6}$/),
  name: z.string().min(2).max(60),
  role: z.enum(["CLIENT", "HELPER"]),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function registerAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    phone: String(formData.get("phone") ?? "").trim(),
    code: String(formData.get("code") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    role: String(formData.get("role") ?? "CLIENT"),
    email: String(formData.get("email") ?? "").toLowerCase().trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const otp = await verifyOtp(parsed.data.phone, parsed.data.code);
    if (!otp.ok) return { error: "Invalid OTP code" };

    const existsPhone = await db.user.findUnique({ where: { phoneE164: parsed.data.phone } });
    if (existsPhone) return { error: "Phone already registered" };
    const existsEmail = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (existsEmail) return { error: "Email already registered" };

    const user = await db.user.create({
      data: {
        phoneE164: parsed.data.phone,
        email: parsed.data.email,
        passwordHash: hashPassword(parsed.data.password),
        role: parsed.data.role,
        status: "PROBATION",
        verifTier: "TIER_0_PHONE",
        ...(parsed.data.role === "CLIENT"
          ? { clientProfile: { create: { fullName: parsed.data.name } } }
          : {
              helperProfile: {
                create: {
                  displayName: parsed.data.name,
                  serviceAreas: [],
                  photoUrls: [],
                  radiusKm: 15,
                },
              },
            }),
      },
    });

    await setSession(user.id);
    redirect(user.role === "HELPER" ? "/helper/dashboard" : "/discover");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    console.error("[registerAction]", e);
    return {
      error: "Registration service is unavailable — the database isn't configured yet.",
    };
  }
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}
