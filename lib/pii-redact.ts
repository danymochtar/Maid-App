// Strip PII from in-app chat to prevent off-platform leakage.
// Catches: MY phone numbers (+60..., 60..., 01X-XXXXXXX, 01XXXXXXXX),
// emails, common social handles (@user, t.me/x, wa.me/x).

const PHONE_MY = /(?:\+?60[\s-]?|0)1\d[\s-]?\d{3,4}[\s-]?\d{3,4}/g;
const PHONE_GENERIC = /\b(?:\+?\d[\s-]?){8,15}\b/g;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const SOCIAL = /(?:t\.me\/|wa\.me\/|whatsapp\.com\/|telegram\.me\/|@[a-z0-9_]{3,})/gi;

export type RedactResult = { redacted: string; types: string[] };

export function redactPii(text: string): RedactResult {
  const types = new Set<string>();
  let out = text;

  out = out.replace(PHONE_MY, () => {
    types.add("phone");
    return "[phone hidden]";
  });
  out = out.replace(PHONE_GENERIC, () => {
    types.add("phone");
    return "[phone hidden]";
  });
  out = out.replace(EMAIL, () => {
    types.add("email");
    return "[email hidden]";
  });
  out = out.replace(SOCIAL, () => {
    types.add("social");
    return "[contact hidden]";
  });

  return { redacted: out, types: Array.from(types) };
}
