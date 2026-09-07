-- ─────────────────────────────────────────────────────────────────────
--  social_links — add the table to a database created before it existed
--
--  The model, route and frontend for social links shipped without the
--  table being created on the server, so GET /api/social-links answered
--  500 while every other CMS endpoint stayed healthy.
--
--  Run once against the target database:
--    mysql -u <user> -p <database> < 2026-09-07-social-links.sql
--
--  Safe to re-run: the table creation is IF NOT EXISTS and the starter
--  rows are INSERT IGNORE, so nothing already there is touched.
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `social_links` (
  `id` INTEGER UNSIGNED auto_increment ,
  `name` VARCHAR(80) NOT NULL,
  `platform` ENUM('facebook', 'instagram', 'youtube', 'twitter', 'linkedin', 'whatsapp', 'other') NOT NULL DEFAULT 'other',
  `url` VARCHAR(400) NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Starter rows, deliberately inactive: the URLs are placeholders, so the
-- footer stays empty until someone sets the real ones in the admin panel
-- and ticks each row active.
INSERT IGNORE INTO `social_links`
  (`id`, `name`, `platform`, `url`, `sort_order`, `is_active`, `created_at`, `updated_at`)
VALUES
  (1, 'Facebook',    'facebook',  'https://www.facebook.com/',  1, 0, NOW(), NOW()),
  (2, 'Instagram',   'instagram', 'https://www.instagram.com/', 2, 0, NOW(), NOW()),
  (3, 'YouTube',     'youtube',   'https://www.youtube.com/',   3, 0, NOW(), NOW()),
  (4, 'X (Twitter)', 'twitter',   'https://x.com/',             4, 0, NOW(), NOW()),
  (5, 'LinkedIn',    'linkedin',  'https://www.linkedin.com/',  5, 0, NOW(), NOW()),
  (6, 'WhatsApp',    'whatsapp',  'https://wa.me/',             6, 0, NOW(), NOW());
