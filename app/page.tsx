import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl">🧹✨</div>
      <h1 className="mt-6 text-4xl font-bold tracking-tight">Pembantu</h1>
      <p className="mt-3 text-balance text-lg text-zinc-600">
        Swipe to find your perfect helper. Cleaning, cooking, errands, and more — booked in seconds,
        paid securely.
      </p>

      <div className="mt-10 flex w-full flex-col gap-3">
        <Link
          href="/discover"
          className="rounded-full bg-brand-500 px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-brand-600"
        >
          Find a helper
        </Link>
        <Link
          href="/onboarding/phone?role=helper"
          className="rounded-full border border-zinc-200 bg-white px-6 py-4 text-base font-semibold text-zinc-900 transition hover:bg-zinc-50"
        >
          Earn as a helper
        </Link>
      </div>

      <p className="mt-12 text-xs text-zinc-400">
        Malaysia · pay-after-service · phone-OTP signup · in-app chat with PII protection
      </p>
    </main>
  );
}
