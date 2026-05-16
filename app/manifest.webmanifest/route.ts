import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    name: "Pembantu",
    short_name: "Pembantu",
    description: "Swipe-to-match marketplace for personal helpers in Malaysia.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#f97316",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  });
}
