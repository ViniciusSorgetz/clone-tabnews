import { createRouter } from "next-connect";
import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database.js";
import controller from "infra/controller";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(req, res) {
  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const defaultMigrationOptions = await getMigrationsOptions();
    const pandingMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
    });
    return res.status(200).json(pandingMigrations);
  } finally {
    await dbClient?.end();
  }
}

async function postHandler(req, res) {
  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const defaultMigrationOptions = await getMigrationsOptions();
    const migratedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
      dryRun: false,
    });

    if (migratedMigrations.length > 0) {
      return res.status(201).json(migratedMigrations);
    }
    return res.status(200).json(migratedMigrations);
  } finally {
    await dbClient?.end();
  }
}

async function getMigrationsOptions() {
  const defaultMigrationOptions = {
    databaseUrl: process.env.DATABASE_URL,
    dryRun: true,
    dir: resolve("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };

  return defaultMigrationOptions;
}
