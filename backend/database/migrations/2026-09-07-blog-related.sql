-- ─────────────────────────────────────────────────────────────────────
--  blog_related — choosing what appears under "Other Blog"
--
--  The article page ends with three sibling posts. Which three was decided
--  in the controller: the newest published posts that were not the one
--  being read. Editorially that is the one part of the page nobody could
--  steer — a post could not point at the two articles that actually
--  followed on from it.
--
--  This table records the picks. `blog_id` is the article being read and
--  `related_blog_id` one of the posts it links out to, ordered by
--  `sort_order`.
--
--  It is an override, not a replacement. A post with no rows here keeps
--  the automatic list, so every existing article renders exactly as it
--  does today until someone picks something in Admin → Blogs.
--
--  Both foreign keys cascade, so deleting a post clears the rows it owns
--  and the rows that point at it in one go.
--
--  Run once against the target database:
--    mysql -u <user> -p <database> < 2026-09-07-blog-related.sql
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `blog_related` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `blog_id` INTEGER UNSIGNED NOT NULL,
  `related_blog_id` INTEGER UNSIGNED NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `blog_related_blog_id_related_blog_id` (`blog_id`, `related_blog_id`),
  FOREIGN KEY (`blog_id`) REFERENCES `blogs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`related_blog_id`) REFERENCES `blogs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `blog_related_blog_id` ON `blog_related` (`blog_id`);
