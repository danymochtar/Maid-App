import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col p-6">
      <Link href="/" className="text-sm text-zinc-500">
        ← Back
      </Link>
      <h1 className="mt-8 text-3xl font-bold">Create account</h1>
      <p className="mt-2 text-zinc-600">Phone OTP + email/password for login.</p>

      <RegisterForm />

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-600">
          Sign in
        </Link>
      </p>
    </main>
  );
}
