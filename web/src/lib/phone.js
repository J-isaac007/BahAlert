// Philippine mobile numbers. Shared by the website and the alert service (service/), so keep it
// dependency-free. Stored form is E.164: +639XXXXXXXXX.

// Accepts 0917 123 4567, 917-123-4567, 639171234567, +63 917 123 4567. Returns null if not a PH mobile.
export function normalizePhone(input) {
  const digits = String(input ?? '').replace(/[\s().-]/g, '');
  const m = digits.match(/^(?:\+?63|0)?(9\d{9})$/);
  return m ? `+63${m[1]}` : null;
}

export const isValidPhone = (input) => normalizePhone(input) !== null;

// +639171234567 -> 0917 123 4567
export function formatPhone(e164) {
  const n = normalizePhone(e164);
  if (!n) return String(e164 ?? '');
  const local = `0${n.slice(3)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

// +639171234567 -> 0917 ••• 4567 (lists and admin views)
export function maskPhone(e164) {
  const n = normalizePhone(e164);
  if (!n) return '';
  const local = `0${n.slice(3)}`;
  return `${local.slice(0, 4)} ••• ${local.slice(7)}`;
}

// Resident account id for a number: the same person gets the same account on any phone or browser
export function residentIdFor(input) {
  const n = normalizePhone(input);
  return n ? `ph_${n.slice(1)}` : null;
}

export const isResidentUid = (uid) => typeof uid === 'string' && /^ph_639\d{9}$/.test(uid);
