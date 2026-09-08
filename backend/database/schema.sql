-- ══════════════════════════════════════════════════════════════════════
--  Grow Farms — MySQL schema
--
--  Generated from the Sequelize models by:
--    node src/scripts/generateSql.js
--
--  You do not have to run this by hand — `npm run db:migrate` builds the
--  same tables. This file is here for DBAs, for cPanel/phpMyAdmin imports,
--  and for review.
-- ══════════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS `growfarms`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `growfarms`;

SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────────────
--  admins
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INTEGER UNSIGNED auto_increment ,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(160) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin', 'admin', 'editor') NOT NULL DEFAULT 'admin',
  `avatar` VARCHAR(255),
  `phone` VARCHAR(30),
  `is_active` TINYINT(1) NOT NULL DEFAULT true,
  `last_login_at` DATETIME,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
--  categories
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INTEGER UNSIGNED auto_increment ,
  `name` VARCHAR(120) NOT NULL,
  `slug` VARCHAR(140) NOT NULL UNIQUE,
  `type` ENUM('project', 'package', 'blog') NOT NULL DEFAULT 'project',
  `description` TEXT,
  `image` VARCHAR(255),
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `categories_type` ON `categories` (`type`);
CREATE INDEX `categories_is_active` ON `categories` (`is_active`);

-- ─────────────────────────────────────────────────────────────────────
--  projects
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `projects` (
  `id` INTEGER UNSIGNED auto_increment ,
  `slug` VARCHAR(160) NOT NULL UNIQUE,
  `title` VARCHAR(160) NOT NULL,
  `short_description` VARCHAR(500),
  `full_description` TEXT,
  `location` VARCHAR(200),
  `total_area` VARCHAR(80),
  `category_id` INTEGER UNSIGNED,
  `hero_image` VARCHAR(255),
  `map_image` VARCHAR(255),
  `about_eyebrow` VARCHAR(80),
  `about_title` VARCHAR(200),
  `about_body` TEXT,
  `about_image` VARCHAR(255),
  `about_image_2` VARCHAR(255),
  `about_image_3` VARCHAR(255),
  `about_image_4` VARCHAR(255),
  `why_choose_eyebrow` VARCHAR(80),
  `why_choose_title` VARCHAR(200),
  `why_choose_body` TEXT,
  `invest_title` VARCHAR(200),
  `invest_body` TEXT,
  `invest_image` VARCHAR(255),
  `map_pin_top` DECIMAL(5,2),
  `map_pin_left` DECIMAL(5,2),
  `status` ENUM('active', 'inactive', 'sold_out') NOT NULL DEFAULT 'active',
  `is_featured` TINYINT(1) NOT NULL DEFAULT false,
  `show_on_map` TINYINT(1) NOT NULL DEFAULT true,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `meta_title` VARCHAR(180),
  `meta_description` VARCHAR(320),
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `projects_status` ON `projects` (`status`);
CREATE INDEX `projects_is_featured` ON `projects` (`is_featured`);
CREATE INDEX `projects_category_id` ON `projects` (`category_id`);

-- ─────────────────────────────────────────────────────────────────────
--  project_images
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `project_images` (
  `id` INTEGER UNSIGNED auto_increment ,
  `project_id` INTEGER UNSIGNED NOT NULL,
  `image_path` VARCHAR(255) NOT NULL,
  `alt_text` VARCHAR(200),
  `is_primary` TINYINT(1) NOT NULL DEFAULT false,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `project_images_project_id` ON `project_images` (`project_id`);

-- ─────────────────────────────────────────────────────────────────────
--  packages
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `packages` (
  `id` INTEGER UNSIGNED auto_increment ,
  `project_id` INTEGER UNSIGNED,
  `category_id` INTEGER UNSIGNED,
  `slug` VARCHAR(160) NOT NULL UNIQUE,
  `title` VARCHAR(160) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(14,2),
  `price_label` VARCHAR(60),
  `area_sqft` INTEGER UNSIGNED,
  `built_up_sqft` INTEGER UNSIGNED,
  `configuration` VARCHAR(60),
  `button_variant` ENUM('solid', 'outline') NOT NULL DEFAULT 'outline',
  `button_color` VARCHAR(20) NOT NULL DEFAULT '#D4AF37',
  `button_label` VARCHAR(60) NOT NULL DEFAULT 'Book Now',
  `card_rotate` DECIMAL(5,2) NOT NULL DEFAULT 0,
  `status` ENUM('active', 'inactive', 'sold_out') NOT NULL DEFAULT 'active',
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `packages_project_id` ON `packages` (`project_id`);
CREATE INDEX `packages_status` ON `packages` (`status`);

-- ─────────────────────────────────────────────────────────────────────
--  package_images
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `package_images` (
  `id` INTEGER UNSIGNED auto_increment ,
  `package_id` INTEGER UNSIGNED NOT NULL,
  `image_path` VARCHAR(255) NOT NULL,
  `alt_text` VARCHAR(200),
  `is_primary` TINYINT(1) NOT NULL DEFAULT false,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `package_images_package_id` ON `package_images` (`package_id`);

-- ─────────────────────────────────────────────────────────────────────
--  package_tags
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `package_tags` (
  `id` INTEGER UNSIGNED auto_increment ,
  `package_id` INTEGER UNSIGNED NOT NULL,
  `label` VARCHAR(80) NOT NULL,
  `accent_color` VARCHAR(20),
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `package_tags_package_id` ON `package_tags` (`package_id`);

-- ─────────────────────────────────────────────────────────────────────
--  amenities
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `amenities` (
  `id` INTEGER UNSIGNED auto_increment ,
  `name` VARCHAR(120) NOT NULL,
  `icon_key` VARCHAR(60),
  `icon_image` VARCHAR(255),
  `description` VARCHAR(300),
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
--  project_amenities
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `project_amenities` (
  `id` INTEGER UNSIGNED auto_increment ,
  `project_id` INTEGER UNSIGNED NOT NULL,
  `amenity_id` INTEGER UNSIGNED NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`amenity_id`) REFERENCES `amenities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `project_amenities_project_id_amenity_id` ON `project_amenities` (`project_id`, `amenity_id`);

-- ─────────────────────────────────────────────────────────────────────
--  facilities
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `facilities` (
  `id` INTEGER UNSIGNED auto_increment ,
  `project_id` INTEGER UNSIGNED,
  `name` VARCHAR(120) NOT NULL,
  `icon_image` VARCHAR(255),
  `distance` VARCHAR(60),
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `facilities_project_id` ON `facilities` (`project_id`);

-- ─────────────────────────────────────────────────────────────────────
--  travel_routes
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `travel_routes` (
  `id` INTEGER UNSIGNED auto_increment ,
  `project_id` INTEGER UNSIGNED,
  `mode` ENUM('road', 'train', 'air', 'other') NOT NULL DEFAULT 'road',
  `label` VARCHAR(80) NOT NULL,
  `icon_image` VARCHAR(255),
  `description` TEXT,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `travel_routes_project_id` ON `travel_routes` (`project_id`);

-- ─────────────────────────────────────────────────────────────────────
--  buying_steps
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `buying_steps` (
  `id` INTEGER UNSIGNED auto_increment ,
  `scope` ENUM('details', 'blog') NOT NULL DEFAULT 'details',
  `project_id` INTEGER UNSIGNED,
  `step_number` VARCHAR(6) NOT NULL,
  `title` VARCHAR(160) NOT NULL,
  `description` TEXT,
  `pos_top` VARCHAR(12),
  `pos_left` VARCHAR(12),
  `width` INTEGER,
  `rotate` DECIMAL(5,2) NOT NULL DEFAULT 0,
  `default_open` TINYINT(1) NOT NULL DEFAULT false,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `buying_steps_scope` ON `buying_steps` (`scope`);
CREATE INDEX `buying_steps_project_id` ON `buying_steps` (`project_id`);

-- ─────────────────────────────────────────────────────────────────────
--  why_pali_slides
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `why_pali_slides` (
  `id` INTEGER UNSIGNED auto_increment ,
  `title` VARCHAR(160) NOT NULL,
  `description` TEXT,
  `image` VARCHAR(255),
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
--  why_choose_cards
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `why_choose_cards` (
  `id` INTEGER UNSIGNED auto_increment ,
  `project_id` INTEGER UNSIGNED,
  `position` ENUM('left', 'center', 'right') NOT NULL DEFAULT 'center',
  `title` VARCHAR(160) NOT NULL,
  `body` TEXT,
  `image` VARCHAR(255),
  `alt_text` VARCHAR(200),
  `object_position` VARCHAR(40) NOT NULL DEFAULT 'center',
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `why_choose_cards_project_id` ON `why_choose_cards` (`project_id`);

-- ─────────────────────────────────────────────────────────────────────
--  philosophy_cards
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `philosophy_cards` (
  `id` INTEGER UNSIGNED auto_increment ,
  `title` VARCHAR(120) NOT NULL,
  `body` TEXT,
  `icon_key` VARCHAR(60),
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
--  faqs
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `faqs` (
  `id` INTEGER UNSIGNED auto_increment ,
  `project_id` INTEGER UNSIGNED,
  `question` VARCHAR(400) NOT NULL,
  `answer` TEXT NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `faqs_project_id` ON `faqs` (`project_id`);

-- ─────────────────────────────────────────────────────────────────────
--  testimonials
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `testimonials` (
  `id` INTEGER UNSIGNED auto_increment ,
  `project_id` INTEGER UNSIGNED,
  `youtube_id` VARCHAR(40),
  `author_name` VARCHAR(120),
  `author_role` VARCHAR(120),
  `quote` TEXT,
  `thumbnail` VARCHAR(255),
  `rating` TINYINT UNSIGNED,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `testimonials_project_id` ON `testimonials` (`project_id`);

-- ─────────────────────────────────────────────────────────────────────
--  social_links
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

-- ─────────────────────────────────────────────────────────────────────
--  blogs
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `blogs` (
  `id` INTEGER UNSIGNED auto_increment ,
  `slug` VARCHAR(200) NOT NULL UNIQUE,
  `title` VARCHAR(240) NOT NULL,
  `excerpt` VARCHAR(500),
  `content` LONGTEXT,
  `hero_title` VARCHAR(240),
  `hero_subtitle` VARCHAR(400),
  `sub_heading` VARCHAR(240),
  `second_description` TEXT,
  `quote_text` TEXT,
  `quote_author` VARCHAR(160),
  `featured_image` VARCHAR(255),
  `banner_image` VARCHAR(255),
  `category_id` INTEGER UNSIGNED,
  `author_name` VARCHAR(120) NOT NULL DEFAULT 'Admin',
  `published_at` DATETIME,
  `status` ENUM('draft', 'published') NOT NULL DEFAULT 'published',
  `views` INTEGER UNSIGNED NOT NULL DEFAULT 0,
  `is_featured` TINYINT(1) NOT NULL DEFAULT false,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `meta_title` VARCHAR(180),
  `meta_description` VARCHAR(320),
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `blogs_status` ON `blogs` (`status`);
CREATE INDEX `blogs_category_id` ON `blogs` (`category_id`);
CREATE INDEX `blogs_published_at` ON `blogs` (`published_at`);

-- ─────────────────────────────────────────────────────────────────────
--  blog_checklist
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `blog_checklist` (
  `id` INTEGER UNSIGNED auto_increment ,
  `blog_id` INTEGER UNSIGNED NOT NULL,
  `item_text` VARCHAR(400) NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`blog_id`) REFERENCES `blogs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `blog_checklist_blog_id` ON `blog_checklist` (`blog_id`);

-- ─────────────────────────────────────────────────────────────────────
--  blog_images
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `blog_images` (
  `id` INTEGER UNSIGNED auto_increment ,
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

-- ─────────────────────────────────────────────────────────────────────
--  blog_steps
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `blog_steps` (
  `id` INTEGER UNSIGNED auto_increment ,
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
--  blog_related
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `blog_related` (
  `id` INTEGER UNSIGNED auto_increment ,
  `blog_id` INTEGER UNSIGNED NOT NULL,
  `related_blog_id` INTEGER UNSIGNED NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`blog_id`) REFERENCES `blogs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`related_blog_id`) REFERENCES `blogs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `blog_related_blog_id_related_blog_id` ON `blog_related` (`blog_id`, `related_blog_id`);
CREATE INDEX `blog_related_blog_id` ON `blog_related` (`blog_id`);

-- ─────────────────────────────────────────────────────────────────────
--  enquiries
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `enquiries` (
  `id` INTEGER UNSIGNED auto_increment ,
  `source` ENUM('enquiry_modal', 'contact_page', 'package', 'other') NOT NULL DEFAULT 'contact_page',
  `name` VARCHAR(120) NOT NULL,
  `first_name` VARCHAR(60),
  `last_name` VARCHAR(60),
  `email` VARCHAR(254) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `message` TEXT,
  `project_id` INTEGER UNSIGNED,
  `package_id` INTEGER UNSIGNED,
  `subject` VARCHAR(200),
  `status` ENUM('new', 'read', 'contacted', 'closed') NOT NULL DEFAULT 'new',
  `admin_notes` TEXT,
  `handled_by` INTEGER UNSIGNED,
  `ip_address` VARCHAR(64),
  `user_agent` VARCHAR(400),
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (`handled_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `enquiries_status` ON `enquiries` (`status`);
CREATE INDEX `enquiries_source` ON `enquiries` (`source`);
CREATE INDEX `enquiries_project_id` ON `enquiries` (`project_id`);
CREATE INDEX `enquiries_created_at` ON `enquiries` (`created_at`);

-- ─────────────────────────────────────────────────────────────────────
--  website_content
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `website_content` (
  `id` INTEGER UNSIGNED auto_increment ,
  `page` ENUM('home', 'about', 'details', 'blogs', 'contact', 'global') NOT NULL DEFAULT 'home',
  `section_key` VARCHAR(80) NOT NULL,
  `label` VARCHAR(160),
  `title` VARCHAR(400),
  `subtitle` VARCHAR(400),
  `body` TEXT,
  `image` VARCHAR(255),
  `link_url` VARCHAR(400),
  `link_label` VARCHAR(120),
  `extra_data` JSON,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `website_content_page_section_key` ON `website_content` (`page`, `section_key`);
CREATE INDEX `website_content_page` ON `website_content` (`page`);

-- ─────────────────────────────────────────────────────────────────────
--  settings
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INTEGER UNSIGNED auto_increment ,
  `setting_key` VARCHAR(80) NOT NULL UNIQUE,
  `setting_value` TEXT,
  `label` VARCHAR(160),
  `setting_group` ENUM('general', 'contact', 'social', 'seo', 'media') NOT NULL DEFAULT 'general',
  `setting_type` ENUM('text', 'textarea', 'image', 'url', 'email', 'number', 'boolean') NOT NULL DEFAULT 'text',
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `settings_setting_group` ON `settings` (`setting_group`);

SET FOREIGN_KEY_CHECKS = 1;
