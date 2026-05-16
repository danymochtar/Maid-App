import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pembantu — book a helper in seconds",
  description:
    "Swipe-to-match marketplace for personal helpers in Malaysia. Cleaning, cooking, errands, eldercare, and more.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Pembantu" },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
