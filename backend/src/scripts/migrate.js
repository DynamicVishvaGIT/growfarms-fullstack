"use strict";

/**
 * Create (or update) every table from the Sequelize models.
 *
 *   node src/scripts/migrate.js           → create missing tables, add columns
 *   node src/scripts/migrate.js --force   → DROP and recreate everything
 *
 * `--force` destroys all data, so it refuses to run against NODE_ENV=production.
 */



const env = require("../config/env");
const db = require("../models");

const force = process.argv.includes("--force");

async function run() {
  if (force && env.isProduction) {
    console.error("[migrate] --force is refused in production. Aborting.");
    process.exit(1);
  }

  console.log(`[migrate] connecting to ${env.db.host}:${env.db.port}/${env.db.name}`);
  await db.sequelize.authenticate();

  if (force) {
    console.log("[migrate] --force: dropping and recreating all tables");
    await db.sequelize.sync({ force: true });
  } else {
    console.log("[migrate] syncing schema (alter)");
    await db.sequelize.sync({ alter: true });
  }

  const tables = await db.sequelize.getQueryInterface().showAllTables();
  console.log(`[migrate] done. ${tables.length} tables present:`);
  console.log(`          ${tables.sort().join(", ")}`);

  await db.sequelize.close();
}

run().catch((err) => {
  console.error("[migrate] failed:", err.message);
  if (err.original) console.error("          ", err.original.sqlMessage || err.original.message);
  process.exit(1);
});
