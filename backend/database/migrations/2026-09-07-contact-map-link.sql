-- ─────────────────────────────────────────────────────────────────────
--  google_map_link — the "Open in Google Maps" address the contact page
--  cards and the map section link out to.
--
--  The embed URL already had a setting (`google_map_embed`), but an
--  ?output=embed URL is not something a visitor can open in a new tab,
--  so the location card had nowhere to point. This adds the companion
--  key that Admin → Contact Page writes.
--
--  Run once against the target database:
--    mysql -u <user> -p <database> < 2026-09-07-contact-map-link.sql
--
--  Safe to re-run: INSERT IGNORE leaves an existing row untouched.
-- ─────────────────────────────────────────────────────────────────────

INSERT IGNORE INTO `settings`
  (`setting_key`, `setting_value`, `label`, `setting_group`, `setting_type`, `sort_order`, `created_at`, `updated_at`)
VALUES
  (
    'google_map_link',
    'https://www.google.com/maps?q=Mumbai,Maharashtra,India',
    'Google Maps link (opens in a new tab)',
    'contact',
    'url',
    7,
    NOW(),
    NOW()
  );

-- The contact cards themselves live in `website_content` as JSON and are
-- edited in the admin panel; the per-card `link` key is optional, so an
-- existing row needs no change here.
