"use client";

import { useActionState } from "react";
import { loginAction, type AuthState } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, {});

  return (
    <form action={action} className="mt-8 flex flex-col gap-3">
      <label className="block">
        <span className="text-xs font-medium text-zinc-500">Email</span>
        <input
          name="email"
          type="email"
          required
          defaultValue="test@maidapp.ai"
          className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-3 text-base"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-zinc-500">Password</span>
        <input
          name="password"
          type="password"
          required
          defaultValue="test123"
          className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-3 text-base"
        />
      </label>
      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-brand-500 py-4 font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
