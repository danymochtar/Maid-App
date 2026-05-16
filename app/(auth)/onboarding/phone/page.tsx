import Link from "next/link";

export default function PhonePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col p-6">
      <Link href="/" className="text-sm text-zinc-500">
        ← Back
      </Link>
      <h1 className="mt-8 text-3xl font-bold">Enter your phone</h1>
      <p className="mt-2 text-zinc-600">
        We'll send a one-time code via SMS. Malaysian numbers only at launch.
      </p>

      <form action="/onboarding/otp" className="mt-8 flex flex-col gap-4">
        <div className="flex gap-2">
          <span className="grid place-items-center rounded-xl bg-zinc-100 px-4 text-zinc-700">
            +60
          </span>
          <input
            type="tel"
            name="phone"
            inputMode="tel"
            placeholder="12 345 6789"
            required
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-lg"
          />
        </div>
        <input type="hidden" name="role" defaultValue="" />
        <button
          type="submit"
          className="rounded-full bg-brand-500 py-4 font-semibold text-white"
        >
          Send code
        </button>
        <p className="text-center text-xs text-zinc-500">
          Dev mode: <code>DEV_OTP_BYPASS=1</code> accepts code <strong>000000</strong>.
        </p>
      </form>
    </main>
  );
}
