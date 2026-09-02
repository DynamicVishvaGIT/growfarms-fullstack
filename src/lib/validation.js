/**
 * Shared form-validation rules.
 *
 * Every validator takes the raw field value and returns an error string,
 * or "" when the value is acceptable. Forms compose these into a single
 * `errors` object keyed by field name.
 */

// Letters plus the punctuation that legitimately shows up in names
// (O'Brien, Jean-Luc, Dr. Rao). Must start with a letter.
const NAME_RE = /^[A-Za-z][A-Za-z\s'.-]*$/;

// Deliberately permissive but requires a real TLD.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

// Characters a person might reasonably type into a phone field.
const PHONE_ALLOWED_RE = /^[\d\s+()-]+$/;

export function validateName(value, label = "name") {
  const v = (value || "").trim();
  if (!v) return `Please enter your ${label}`;
  if (v.length < 2) return `Your ${label} must be at least 2 characters`;
  if (v.length > 60) return `Your ${label} must be under 60 characters`;
  if (!NAME_RE.test(v)) return `Your ${label} can only contain letters, spaces and - . '`;
  return "";
}

export function validateEmail(value) {
  const v = (value || "").trim();
  if (!v) return "Please enter your email address";
  if (v.length > 254) return "That email address is too long";
  if (!EMAIL_RE.test(v)) return "Please enter a valid email address";
  return "";
}

export function validatePhone(value) {
  const v = (value || "").trim();
  if (!v) return "Please enter your phone number";
  if (!PHONE_ALLOWED_RE.test(v))
    return "Phone number can only contain digits, spaces and + - ( )";

  // Count digits only, so formatting never changes the verdict.
  const digits = v.replace(/\D/g, "");
  if (digits.length < 10) return "Please enter a valid phone number (at least 10 digits)";
  if (digits.length > 15) return "Please enter a valid phone number (at most 15 digits)";
  return "";
}

export function validateMessage(value, { required = false, min = 10, max = 1000 } = {}) {
  const v = (value || "").trim();
  if (!v) return required ? "Please enter a message" : "";
  if (v.length < min) return `Your message must be at least ${min} characters`;
  if (v.length > max) return `Your message must be under ${max} characters`;
  return "";
}

/** Drop empty-string entries so `Object.keys(errors).length` means "is invalid". */
export function compactErrors(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, msg]) => msg));
}

/** Shared input classes; the border swaps to red in the error state. */
export function fieldClass(hasError, extra = "") {
  const base =
    "w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-gray-700 " +
    "placeholder:text-gray-400 focus:outline-none transition";
  const border = hasError
    ? "border-red-400 focus:border-red-500"
    : "border-gray-200 focus:border-[#1e3a2b]";
  return `${base} ${border} ${extra}`.trim();
}
