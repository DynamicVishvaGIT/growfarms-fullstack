-- ─────────────────────────────────────────────────────────────────────
--  projects.why_choose_* — the heading above the Why Choose Us cards
--
--  The three cards were already per-project rows, but the label, the
--  headline ("Why Choose Sarasview?") and the paragraph introducing them
--  were hard-coded in the component, so every project's page named the
--  same one. These three columns put that block in Admin → Project
--  Content → Why Choose Us alongside the cards.
--
--  Run once against the target database:
--    mysql -u <user> -p <database> < 2026-09-07-why-choose-heading.sql
--
--  Columns are nullable with no default: a project that leaves them blank
--  renders exactly the copy the site ships with.
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE `projects`
  ADD COLUMN `why_choose_eyebrow` VARCHAR(80) NULL AFTER `about_image_4`,
  ADD COLUMN `why_choose_title` VARCHAR(200) NULL AFTER `why_choose_eyebrow`,
  ADD COLUMN `why_choose_body` TEXT NULL AFTER `why_choose_title`;
