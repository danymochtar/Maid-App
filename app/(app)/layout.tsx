import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (me.role === "HELPER") redirect("/helper/dashboard");

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <div className="sticky top-0 z-30 mx-auto flex max-w-md items-center justify-between bg-zinc-50/95 px-4 py-2 backdrop-blur">
        <span className="text-sm text-zinc-500">
          Hi, <span className="font-semibold text-zinc-900">{me.displayName}</span>
        </span>
        <form action="/api/logout" method="post">
          <button className="text-xs text-zinc-500 underline">Sign out</button>
        </form>
      </div>
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md items-center justify-around border-t border-zinc-200 bg-white py-2">
        <Link href="/discover" className="flex flex-col items-center px-4 py-1 text-xs">
          <span className="text-xl">🃏</span>
          <span>Discover</span>
        </Link>
        <Link href="/matches" className="flex flex-col items-center px-4 py-1 text-xs">
          <span className="text-xl">💬</span>
          <span>Matches</span>
        </Link>
        <Link href="/bookings" className="flex flex-col items-center px-4 py-1 text-xs">
          <span className="text-xl">📅</span>
          <span>Bookings</span>
        </Link>
      </nav>
    </div>
  );
}
