-- ══════════════════════════════════════════════════════════════════════
--  Grow Farms — create the database and its application user
--
--  HOW TO RUN (important):
--    1. MySQL Workbench → open "Local instance MySQL80"
--    2. File → Open SQL Script → pick this file
--    3. Click the ⚡ LIGHTNING BOLT  ("Execute All")
--
--    Do NOT use Ctrl+Enter — that runs only the statement under the
--    cursor, which is the usual reason this appears to do nothing.
--
--  The last two queries print what was actually created, so you can see
--  whether it worked. The password here already matches backend/.env.
-- ══════════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS `growfarms`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Drop first so a pre-existing user with a different password cannot
-- silently survive and keep rejecting the backend.
DROP USER IF EXISTS 'growfarms'@'localhost';
DROP USER IF EXISTS 'growfarms'@'127.0.0.1';
DROP USER IF EXISTS 'growfarms'@'%';

CREATE USER 'growfarms'@'localhost'  IDENTIFIED BY 'gf_aIgJoNBKdel3';
CREATE USER 'growfarms'@'127.0.0.1' IDENTIFIED BY 'gf_aIgJoNBKdel3';

GRANT ALL PRIVILEGES ON `growfarms`.* TO 'growfarms'@'localhost';
GRANT ALL PRIVILEGES ON `growfarms`.* TO 'growfarms'@'127.0.0.1';

FLUSH PRIVILEGES;

-- ── Verification — both of these must return rows ────────────────────

SELECT 'DATABASE' AS what, SCHEMA_NAME AS name, DEFAULT_CHARACTER_SET_NAME AS charset
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME = 'growfarms';

SELECT 'USER' AS what, user, host, plugin
FROM mysql.user
WHERE user = 'growfarms';
