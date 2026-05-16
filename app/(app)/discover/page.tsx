import { ServiceCategory } from "@prisma/client";
import { redirect } from "next/navigation";
import { ALL_CATEGORIES } from "@/lib/categories";
import { nextStackPage } from "@/lib/actions/discover";
import { isCategoryEnabled } from "@/lib/env";
import { getSessionUserId } from "@/lib/session";
import { DiscoverClient } from "./discover-client";

export const dynamic = "force-dynamic";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; postcode?: string }>;
}) {
  const uid = await getSessionUserId();
  if (!uid) redirect("/login");

  const sp = await searchParams;
  const initialCategory = (sp.category as ServiceCategory) ?? "HOME_CLEANING";
  const initialPostcode = sp.postcode ?? "50000";
  const enabled = ALL_CATEGORIES.filter(isCategoryEnabled);

  let initialCards: Awaited<ReturnType<typeof nextStackPage>> = [];
  try {
    initialCards = await nextStackPage(uid, {
      category: initialCategory,
      postcode: initialPostcode,
    });
  } catch {
    initialCards = [];
  }

  return (
    <DiscoverClient
      initialCards={initialCards}
      initialFilters={{
        category: initialCategory,
        postcode: initialPostcode,
        minRating: 0,
      }}
      enabledCategories={enabled}
    />
  );
}
