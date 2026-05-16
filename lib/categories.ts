import { ServiceCategory } from "@prisma/client";

export type CategoryMeta = {
  label: string;
  labelBm: string;
  emoji: string;
  groupLabel: string;
  needsExtraTrust?: boolean;
};

export const CATEGORY_META: Record<ServiceCategory, CategoryMeta> = {
  HOME_CLEANING: { label: "House cleaning", labelBm: "Pembersihan rumah", emoji: "🧹", groupLabel: "Home" },
  HOME_COOKING: { label: "Cooking & meal prep", labelBm: "Memasak", emoji: "🍳", groupLabel: "Home" },
  HOME_LAUNDRY: { label: "Laundry & ironing", labelBm: "Dobi & gosok", emoji: "👕", groupLabel: "Home" },
  HOME_ORGANIZING: { label: "Organizing", labelBm: "Susun atur", emoji: "📦", groupLabel: "Home" },
  CARE_CHILD: { label: "Childcare", labelBm: "Jaga anak", emoji: "👶", groupLabel: "Care", needsExtraTrust: true },
  CARE_ELDER: { label: "Eldercare", labelBm: "Jaga warga emas", emoji: "🧓", groupLabel: "Care", needsExtraTrust: true },
  CARE_PET: { label: "Pet care", labelBm: "Jaga haiwan", emoji: "🐶", groupLabel: "Care" },
  CARE_PLANT: { label: "Plant care", labelBm: "Jaga pokok", emoji: "🪴", groupLabel: "Care" },
  ERRANDS_GROCERY: { label: "Grocery run", labelBm: "Beli barang dapur", emoji: "🛒", groupLabel: "Errands" },
  ERRANDS_PHARMACY: { label: "Pharmacy run", labelBm: "Beli ubat", emoji: "💊", groupLabel: "Errands" },
  ERRANDS_PARCEL: { label: "Parcel pickup", labelBm: "Ambil parcel", emoji: "📦", groupLabel: "Errands" },
  ERRANDS_QUEUE: { label: "Queue stand-in", labelBm: "Beratur", emoji: "🚶", groupLabel: "Errands" },
  PERSONAL_ASSISTANT: { label: "Personal assistant", labelBm: "Pembantu peribadi", emoji: "📋", groupLabel: "Assist" },
  EVENT_HELP: { label: "Event help", labelBm: "Bantu majlis", emoji: "🎉", groupLabel: "Assist" },
  TUTORING: { label: "Tutoring", labelBm: "Tuisyen", emoji: "📚", groupLabel: "Assist" },
  HANDY_SMALL: { label: "Small handywork", labelBm: "Kerja kecil", emoji: "🔧", groupLabel: "Assist" },
  DRIVER_ONDEMAND: { label: "On-demand driver", labelBm: "Pemandu", emoji: "🚗", groupLabel: "Other", needsExtraTrust: true },
  BEAUTY_WELLNESS: { label: "Beauty & wellness", labelBm: "Kecantikan", emoji: "💆", groupLabel: "Other", needsExtraTrust: true },
  OTHER: { label: "Other", labelBm: "Lain-lain", emoji: "✨", groupLabel: "Other" },
};

export const ALL_CATEGORIES = Object.keys(CATEGORY_META) as ServiceCategory[];
