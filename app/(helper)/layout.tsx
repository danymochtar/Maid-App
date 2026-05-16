import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export default async function HelperLayout({ children }: { children: React.ReactNode }) {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (me.role !== "HELPER") redirect("/discover");

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md items-center justify-around border-t border-zinc-200 bg-white py-2">
        <Link href="/helper/dashboard" className="flex flex-col items-center px-4 py-1 text-xs">
          <span className="text-xl">🏠</span>
          <span>Home</span>
        </Link>
        <Link href="/helper/interests" className="flex flex-col items-center px-4 py-1 text-xs">
          <span className="text-xl">💌</span>
          <span>Inbox</span>
        </Link>
        <Link href="/matches" className="flex flex-col items-center px-4 py-1 text-xs">
          <span className="text-xl">💬</span>
          <span>Matches</span>
        </Link>
        <Link href="/helper/jobs" className="flex flex-col items-center px-4 py-1 text-xs">
          <span className="text-xl">📅</span>
          <span>Jobs</span>
        </Link>
      </nav>
    </div>
  );
}
