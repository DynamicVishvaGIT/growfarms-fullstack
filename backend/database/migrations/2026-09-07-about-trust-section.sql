-- ─────────────────────────────────────────────────────────────────────
--  about.trust_section — the last two hard-coded strings
--
--  The "15 Years of Cultivating Trust" block already existed in
--  website_content with its heading, paragraph, photograph, counters and
--  pull-quote. Two things on screen had nowhere to live, so they stayed
--  hard-coded in TrustSection.jsx:
--
--    · "Our Legacy"         — the gold pill above the heading
--    · "Certified Stability" — the heading on the white floating card
--
--  The pill maps onto the block's existing `subtitle` column; the card
--  heading joins `card_text` inside `extra_data`.
--
--  The same change wires TrustSection.jsx to this row at all — until now
--  it read none of it, so editing the block in Admin changed nothing on
--  the site.
--
--  Run once against the target database:
--    mysql -u <user> -p <database> < 2026-09-07-about-trust-section.sql
--
--  Only fills what is empty, so wording already edited in Admin is kept.
-- ─────────────────────────────────────────────────────────────────────

UPDATE `website_content`
SET `subtitle` = 'Our Legacy'
WHERE `page` = 'about'
  AND `section_key` = 'trust_section'
  AND (`subtitle` IS NULL OR `subtitle` = '' OR `subtitle` = `title`);

UPDATE `website_content`
SET `extra_data` = JSON_SET(
      COALESCE(`extra_data`, JSON_OBJECT()),
      '$.card_title',
      'Certified Stability'
    )
WHERE `page` = 'about'
  AND `section_key` = 'trust_section'
  AND (
    `extra_data` IS NULL
    OR JSON_EXTRACT(`extra_data`, '$.card_title') IS NULL
  );
