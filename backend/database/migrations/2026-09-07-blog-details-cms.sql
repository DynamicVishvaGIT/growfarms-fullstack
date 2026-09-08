-- ─────────────────────────────────────────────────────────────────────
--  Blog article page → fully editable from Admin
--
--  Everything the article page draws below the banner already came from
--  the post except four things, all of which were hard-coded in
--  BlogDetails.jsx:
--
--    · the wording over the banner ("Blog Details")
--    · the white pull-quote card near the foot of the article
--    · the pair of images under the body copy
--    · the numbered 01 / 02 / 03 steps
--
--  The first two become columns on `blogs`; the last two get their own
--  child tables, matching how `blog_checklist` already works.
--
--  The steps table is a per-post override. A post with no rows of its own
--  keeps falling back to the shared scope='blog' rows in `buying_steps`,
--  which is exactly what every article rendered before this change — so
--  existing posts look identical until someone edits them.
--
--  Run once against the target database:
--    mysql -u <user> -p <database> < 2026-09-07-blog-details-cms.sql
--
--  Every column is nullable and both tables start empty, so nothing on
--  the live site moves until an admin fills something in.
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE `blogs`
  ADD COLUMN `hero_title` VARCHAR(240) NULL AFTER `content`,
  ADD COLUMN `hero_subtitle` VARCHAR(400) NULL AFTER `hero_title`,
  ADD COLUMN `quote_text` TEXT NULL AFTER `second_description`,
  ADD COLUMN `quote_author` VARCHAR(160) NULL AFTER `quote_text`;

CREATE TABLE IF NOT EXISTS `blog_images` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `blog_id` INTEGER UNSIGNED NOT NULL,
  `image_path` VARCHAR(255) NOT NULL,
  `alt_text` VARCHAR(200),
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`blog_id`) REFERENCES `blogs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `blog_images_blog_id` ON `blog_images` (`blog_id`);

CREATE TABLE IF NOT EXISTS `blog_steps` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `blog_id` INTEGER UNSIGNED NOT NULL,
  `step_number` VARCHAR(6) NOT NULL,
  `title` VARCHAR(160) NOT NULL,
  `description` TEXT,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`blog_id`) REFERENCES `blogs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `blog_steps_blog_id` ON `blog_steps` (`blog_id`);

-- ─────────────────────────────────────────────────────────────────────
--  The two page-wide labels, so they read from Admin → Content → Blogs
--  rather than the component. Values match what the page shows today.
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO `website_content`
  (`page`, `section_key`, `label`, `title`, `subtitle`, `link_label`, `sort_order`, `is_active`, `created_at`, `updated_at`)
VALUES
  ('blogs', 'detail_hero', 'Article hero', 'Blog Details', NULL, 'All blogs', 1, 1, NOW(), NOW()),
  ('blogs', 'detail_related', 'Other Blog heading', 'Other Blog', NULL, NULL, 2, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();
