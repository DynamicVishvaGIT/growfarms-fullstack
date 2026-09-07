"use strict";

/**
 * Create any table a model needs but the database does not have yet.
 *
 *   node src/scripts/syncTables.js                  → create missing tables
 *   node src/scripts/syncTables.js --recreate SocialLink
 *                                                   → rebuild one broken table
 *
 * Why this exists alongside `db:migrate`: that one runs `sync({ alter: true })`,
 * which inspects and rewrites columns and indexes across *every* table. That is
 * fine on a dev box and more than you want against live data when all you need
 * is one new table. This only ever issues CREATE TABLE for tables that are
 * absent — existing tables are read, never altered and never dropped.
 *
 * A table that exists but is missing columns cannot be fixed by CREATE TABLE,
 * so those are reported rather than silently skipped. `--recreate <Model>` is
 * the escape hatch for that case; it refuses to drop a table holding rows
 * unless `--force` is also passed.
 */

const env = require("../config/env");
const db = require("../models");

const { sequelize } = db;

/**
 * A readable type name. Stringifying a bare DataType can throw — an ENUM's
 * toSql() reaches for a dialect escaper it does not have out here — so fall
 * back to the type key plus its values.
 */
function typeName(type) {
  try {
    return String(type);
  } catch {
    const key = type?.key || type?.constructor?.key || "unknown";
    return Array.isArray(type?.values) ? `${key}(${type.values.join(", ")})` : key;
  }
}

/** showAllTables() yields plain strings on some dialects and objects on others. */
const tableNameOf = (t) => (typeof t === "string" ? t : t.tableName || t.table_name);

async function existingTables() {
  const rows = await sequelize.getQueryInterface().showAllTables();
  return new Set(rows.map((t) => String(tableNameOf(t)).toLowerCase()));
}

/** Columns the model expects that the live table does not have. */
async function missingColumns(model) {
  let actual;
  try {
    actual = await sequelize.getQueryInterface().describeTable(model.getTableName());
  } catch {
    return [];
  }
  const present = new Set(Object.keys(actual).map((c) => c.toLowerCase()));
  return Object.entries(model.rawAttributes)
    .map(([attr, a]) => ({ column: a.field || attr, type: typeName(a.type) }))
    .filter((c) => !present.has(c.column.toLowerCase()));
}

/**
 * Create every absent table. Returns what happened so the caller — a script or
 * the server's boot — can log it.
 */
async function createMissingTables() {
  const have = await existingTables();
  const created = [];
  const incomplete = [];

  for (const [name, model] of Object.entries(sequelize.models)) {
    const table = String(model.getTableName());

    if (!have.has(table.toLowerCase())) {
      await model.sync(); // CREATE TABLE IF NOT EXISTS — this model only
      created.push({ name, table });
      continue;
    }

    const missing = await missingColumns(model);
    if (missing.length) incomplete.push({ name, table, missing });
  }

  return { created, incomplete };
}

/** Drop and rebuild one model's table. Destructive by definition — hence the guards. */
async function recreate(modelName, force) {
  const model = sequelize.models[modelName];
  if (!model) {
    console.error(`[sync] no model called "${modelName}".`);
    console.error(`       known: ${Object.keys(sequelize.models).join(", ")}`);
    return false;
  }

  const table = model.getTableName();
  let rows = 0;
  try {
    rows = await model.count();
  } catch {
    // Table missing or unreadable; creating it fresh is exactly the fix.
  }

  if (rows > 0 && !force) {
    console.error(`[sync] \`${table}\` holds ${rows} row(s). Refusing to drop it.`);
    console.error("       Re-run with --force if you are certain those rows can go.");
    return false;
  }

  console.log(`[sync] dropping and recreating \`${table}\`${rows ? ` (${rows} row(s) will be lost)` : ""}`);
  await model.drop();
  await model.sync();
  console.log(`[sync] \`${table}\` rebuilt to match the ${modelName} model.`);
  return true;
}

async function run() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const recreateAt = args.indexOf("--recreate");
  const recreateName = recreateAt !== -1 ? args[recreateAt + 1] : null;

  console.log(`[sync] ${env.db.host}:${env.db.port}/${env.db.name}`);
  await sequelize.authenticate();

  if (recreateAt !== -1) {
    if (!recreateName) {
      console.error("[sync] --recreate needs a model name, e.g. --recreate SocialLink");
      process.exitCode = 1;
      return;
    }
    const done = await recreate(recreateName, force);
    process.exitCode = done ? 0 : 1;
    return;
  }

  const { created, incomplete } = await createMissingTables();

  if (created.length) {
    console.log(`[sync] created ${created.length} table(s):`);
    for (const c of created) console.log(`         ${c.table}   (${c.name})`);
  } else {
    console.log("[sync] every model already has its table.");
  }

  if (incomplete.length) {
    console.log("");
    console.log("[sync] these tables exist but do NOT match their model:");
    for (const t of incomplete) {
      console.log(`         ${t.table} is missing: ${t.missing.map((m) => m.column).join(", ")}`);
    }
    console.log("");
    console.log("       CREATE TABLE cannot repair those. For a table with no data worth");
    console.log("       keeping, rebuild it:  npm run db:sync -- --recreate <ModelName>");
    process.exitCode = 1;
  }
}

if (require.main === module) {
  run()
    .catch((err) => {
      console.error("[sync] failed:", err.message);
      if (err.original) console.error("       ", err.original.sqlMessage || err.original.message);
      process.exitCode = 1;
    })
    .finally(() => sequelize.close());
}

module.exports = { createMissingTables, missingColumns };
