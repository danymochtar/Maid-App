"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 font-sans antialiased">
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6 text-center">
          <div className="text-5xl">🍒</div>
          <h1 className="mt-6 text-2xl font-bold text-brand-700">Something went wrong</h1>
          <p className="mt-3 text-sm text-zinc-600">
            The server hit an unexpected error. This usually means the database isn't connected on
            this deployment yet.
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-[10px] text-zinc-400">digest {error.digest}</p>
          )}
          <div className="mt-8 flex w-full flex-col gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-brand-500 py-3 font-semibold text-white"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded-full border border-zinc-200 bg-white py-3 font-semibold text-zinc-700"
            >
              Back to home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
