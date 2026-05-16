import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col p-6">
      <Link href="/" className="text-sm text-zinc-500">
        ← Back
      </Link>
      <h1 className="mt-8 text-3xl font-bold">Welcome back</h1>
      <p className="mt-2 text-zinc-600">Log in to swipe and book.</p>

      <LoginForm />

      <div className="mt-8 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm">
        <p className="font-semibold text-brand-900">Test accounts (seeded)</p>
        <ul className="mt-2 space-y-1 text-brand-900/80">
          <li>
            <strong>Client:</strong> test@maidapp.ai · <code className="rounded bg-white px-1">test123</code>
          </li>
          <li>
            <strong>Helpers:</strong> aishah@maidapp.ai · hafiz@maidapp.ai · meiling@maidapp.ai …
          </li>
          <li>
            All helper passwords: <code className="rounded bg-white px-1">helper123</code>
          </li>
        </ul>
      </div>

      <p className="mt-6 text-center text-sm text-zinc-500">
        New here?{" "}
        <Link href="/register" className="font-semibold text-brand-600">
          Create an account
        </Link>
      </p>
    </main>
  );
}
