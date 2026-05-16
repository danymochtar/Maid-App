import { ServiceCategory } from "@prisma/client";
import { DiscoverClient } from "./discover-client";
import { ALL_CATEGORIES } from "@/lib/categories";
import { isCategoryEnabled } from "@/lib/env";
import { nextStackPage } from "@/lib/actions/discover";

export const dynamic = "force-dynamic";

const DEMO_CLIENT_ID = "demo-client";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; postcode?: string }>;
}) {
  const sp = await searchParams;
  const initialCategory = (sp.category as ServiceCategory) ?? "HOME_CLEANING";
  const initialPostcode = sp.postcode ?? "50000";
  const enabled = ALL_CATEGORIES.filter(isCategoryEnabled);

  let initialCards: Awaited<ReturnType<typeof nextStackPage>> = [];
  try {
    initialCards = await nextStackPage(DEMO_CLIENT_ID, {
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
