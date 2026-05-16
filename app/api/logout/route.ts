import { redirect } from "next/navigation";
import { clearSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  await clearSession();
  redirect("/");
}
