import Link from "next/link";
import { getSessionUser } from "@/lib/session";

export default async function Home() {
  const user = await getSessionUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl">🍒</div>
      <h1 className="mt-6 text-4xl font-bold tracking-tight text-brand-700">Pembantu</h1>
      <p className="mt-3 text-balance text-lg text-zinc-600">
        Swipe to find your perfect helper. Cleaning, cooking, errands, tutoring, handywork — booked
        in seconds, paid securely.
      </p>

      {user ? (
        <div className="mt-10 flex w-full flex-col gap-3">
          <p className="text-sm text-zinc-500">
            Signed in as <span className="font-semibold">{user.displayName}</span> ({user.role.toLowerCase()})
          </p>
          <Link
            href={user.role === "HELPER" ? "/helper/dashboard" : "/discover"}
            className="rounded-full bg-brand-500 px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-brand-600"
          >
            {user.role === "HELPER" ? "Open helper dashboard" : "Open discover"}
          </Link>
          <form action="/api/logout" method="post">
            <button
              type="submit"
              className="w-full rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-medium text-zinc-700"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-10 flex w-full flex-col gap-3">
          <Link
            href="/login"
            className="rounded-full bg-brand-500 px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-brand-600"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-zinc-200 bg-white px-6 py-4 text-base font-semibold text-zinc-900 transition hover:bg-zinc-50"
          >
            Create account
          </Link>
        </div>
      )}

      <p className="mt-12 text-xs text-zinc-400">
        Malaysia · pay-after-service · phone-OTP signup · in-app chat with PII protection
      </p>
    </main>
  );
}
