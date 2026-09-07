import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaXTwitter,
  FaLinkedinIn,
  FaWhatsapp,
  FaLink,
} from "react-icons/fa6";

/**
 * Platform key → icon, mirroring the enum on the SocialLink model.
 *
 * One brand family (Font Awesome 6) throughout, so every glyph shares the same
 * weight and optical size — mixing icon sets is what makes a social row look
 * assembled rather than designed. The brand marks are the compact variants
 * (FaFacebookF, FaLinkedinIn) because they sit inside a circle here, where the
 * boxed logo versions would read as a badge inside a badge.
 */
const ICONS = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  youtube: FaYoutube,
  twitter: FaXTwitter,
  linkedin: FaLinkedinIn,
  whatsapp: FaWhatsapp,
  other: FaLink,
};

/** The icon for a platform key, falling back to a generic link glyph. */
export function iconFor(platform) {
  return ICONS[String(platform || "").toLowerCase()] || FaLink;
}

// Schemes safe to put in an href. Anything else — `javascript:` above all — is
// dropped. The model rejects these on write too; this is the second half of
// that guard, for rows that predate it or arrive from anywhere else.
const SAFE_SCHEME_RE = /^(https?:|mailto:|tel:)/i;
const DIGITS_RE = /[^\d]/g;

/**
 * Turn a stored value into an href, or null if it cannot be linked safely.
 *
 * WhatsApp is the one platform an admin naturally types as a phone number
 * rather than a URL, so a bare number is promoted to a wa.me link instead of
 * being rendered as a dead relative path.
 */
export function toHref(url, platform) {
  const value = String(url || "").trim();
  if (!value) return null;

  if (SAFE_SCHEME_RE.test(value)) return value;

  if (platform === "whatsapp") {
    const digits = value.replace(DIGITS_RE, "");
    return digits ? `https://wa.me/${digits}` : null;
  }

  // A bare domain ("growfarms.co/x") is a common paste; assume https.
  if (/^[\w-]+(\.[\w-]+)+/.test(value)) return `https://${value}`;

  return null;
}
