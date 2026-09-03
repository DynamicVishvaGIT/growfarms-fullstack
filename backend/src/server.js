"use strict";

const app = require("./app");
const env = require("./config/env");
const { connect, sequelize } = require("./config/database");

async function start() {
  try {
    await connect();
  } catch (err) {
    console.error("[boot] could not connect to MySQL.");
    console.error(`       ${err.message}`);
    console.error("       Check DB_HOST / DB_USER / DB_PASSWORD / DB_NAME in backend/.env,");
    console.error("       and that the database exists (npm run db:migrate creates the tables).");
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log("");
    console.log(`  Grow Farms API`);
    console.log(`  env      ${env.nodeEnv}`);
    console.log(`  api      ${env.publicUrl}${env.apiPrefix}`);
    console.log(`  uploads  ${env.publicUrl}/${env.upload.dir}`);
    console.log(`  cors     ${env.corsOrigins.join(", ")}`);
    console.log("");
  });

  const shutdown = (signal) => async () => {
    console.log(`\n[shutdown] ${signal} received, closing gracefully...`);
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
    // Don't let a hung connection block the process forever.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGTERM", shutdown("SIGTERM"));
  process.on("SIGINT", shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    console.error("[unhandledRejection]", reason);
  });
}

start();
