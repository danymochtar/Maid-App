const EARTH_KM = 6371;

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return EARTH_KM * 2 * Math.atan2(Math.sqrt(sa), Math.sqrt(1 - sa));
}

// MY postcodes are 5 digits; first 2 cover state/region — use as a coarse area prefix.
export function postcodePrefix(postcode: string, len = 2): string {
  return postcode.replace(/\D/g, "").slice(0, len);
}

export function postcodesOverlap(a: string[], b: string[]): boolean {
  const set = new Set(a);
  return b.some((p) => set.has(p));
}

export function distanceFor(
  helper: { baseLat: number | null; baseLng: number | null },
  client: { lat: number; lng: number } | null,
): number | null {
  if (!client || helper.baseLat == null || helper.baseLng == null) return null;
  return haversineKm({ lat: helper.baseLat, lng: helper.baseLng }, client);
}
