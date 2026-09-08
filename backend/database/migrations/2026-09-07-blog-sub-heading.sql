-- ─────────────────────────────────────────────────────────────────────
--  blogs.sub_heading / blogs.second_description
--
--  The article page draws a block above its ticked list — a heading and a
--  paragraph. Both were hard-coded in the component, so every post that
--  had checklist items got the same "Key takeaways" with no lead-in.
--  These two columns put that block in Admin → Blogs alongside the list.
--
--  The Excerpt field was removed from the blog form in the same change.
--  Its column is deliberately left in place: dropping it would throw away
--  the wording already written for existing posts, and nothing breaks by
--  keeping it.
--
--  Run once against the target database:
--    mysql -u <user> -p <database> < 2026-09-07-blog-sub-heading.sql
--
--  Both columns are nullable: a post that leaves them blank renders the
--  section exactly as the site does today.
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE `blogs`
  ADD COLUMN `sub_heading` VARCHAR(240) NULL AFTER `content`,
  ADD COLUMN `second_description` TEXT NULL AFTER `sub_heading`;
