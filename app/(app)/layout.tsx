import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
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
