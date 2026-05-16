"use client";

import { useActionState, useState } from "react";
import { registerAction, sendOtpAction, type AuthState } from "@/lib/actions/auth";

export function RegisterForm() {
  const [phone, setPhone] = useState("+60");
  const [role, setRole] = useState<"CLIENT" | "HELPER">("CLIENT");
  const [otpState, otpAction, otpPending] = useActionState<AuthState, FormData>(
    sendOtpAction,
    {},
  );
  const [regState, regAction, regPending] = useActionState<AuthState, FormData>(
    registerAction,
    {},
  );

  return (
    <div className="mt-6 flex flex-col gap-4">
      <fieldset className="rounded-2xl border border-zinc-200 p-4">
        <legend className="px-2 text-xs font-semibold text-zinc-600">Step 1 · Verify phone</legend>
        <form action={otpAction}>
          <label className="block">
            <span className="text-xs text-zinc-500">Malaysian phone (+60…)</span>
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={otpPending}
            className="mt-3 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {otpPending ? "Sending…" : "Send OTP"}
          </button>
          {otpState.info && (
            <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-900">
              {otpState.info}
            </p>
          )}
          {otpState.error && (
            <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {otpState.error}
            </p>
          )}
        </form>
      </fieldset>

      <form action={regAction} className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4">
        <legend className="px-2 text-xs font-semibold text-zinc-600">Step 2 · Your details</legend>

        <input type="hidden" name="phone" value={phone} />

        <label className="block">
          <span className="text-xs text-zinc-500">6-digit code</span>
          <input
            name="code"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            placeholder="000000 in dev"
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-center font-mono text-lg tracking-widest"
          />
        </label>

        <label className="block">
          <span className="text-xs text-zinc-500">Full name</span>
          <input
            name="name"
            required
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2"
          />
        </label>

        <div>
          <span className="text-xs text-zinc-500">I want to…</span>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(["CLIENT", "HELPER"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                  role === r
                    ? "border-brand-500 bg-brand-50 text-brand-900"
                    : "border-zinc-200 bg-white"
                }`}
              >
                {r === "CLIENT" ? "Book helpers" : "Earn as a helper"}
              </button>
            ))}
          </div>
          <input type="hidden" name="role" value={role} />
        </div>

        <label className="block">
          <span className="text-xs text-zinc-500">Email</span>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="text-xs text-zinc-500">Password (min 6 chars)</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2"
          />
        </label>

        {regState.error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{regState.error}</p>
        )}

        <button
          type="submit"
          disabled={regPending}
          className="mt-2 rounded-full bg-brand-500 py-4 font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-60"
        >
          {regPending ? "Creating…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
