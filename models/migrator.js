import database from "infra/database";
import { resolve } from "node:path";
import migrationRunner from "node-pg-migrate";
import { ServiceError } from "infra/errors";

const defaultMigrationOptions = {
  databaseUrl: process.env.DATABASE_URL,
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  log: () => {},
  migrationsTable: "pgmigrations",
};

async function listPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const pandingMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
    });
    return pandingMigrations;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      cause: error,
      message: "Erro ao rodar migrações no banco de dados.",
    });
    throw serviceErrorObject;
  } finally {
    await dbClient?.end();
  }
}

async function runPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const pandingMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dryRun: false,
      dbClient,
    });
    return pandingMigrations;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      cause: error,
      message: "Erro ao rodar migrações no banco de dados.",
    });
    throw serviceErrorObject;
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
