"use strict";

const { Sequelize } = require("sequelize");
const env = require("./env");

/**
 * Single Sequelize instance for the whole app.
 *
 * Sequelize parameterises every query it builds, so all model-driven reads and
 * writes are prepared-statement safe. The few places that need raw SQL use
 * `replacements`, never string interpolation.
 */
const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: "mysql",
  logging: env.db.logging ? (msg) => console.log(`[sql] ${msg}`) : false,
  timezone: "+05:30",
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
    underscored: true,
    freezeTableName: true,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    dateStrings: true,
    typeCast: true,
    charset: "utf8mb4",
  },
});

async function connect() {
  await sequelize.authenticate();
  console.log(`[db] connected to mysql://${env.db.host}:${env.db.port}/${env.db.name}`);
}

module.exports = { sequelize, connect, Sequelize };
