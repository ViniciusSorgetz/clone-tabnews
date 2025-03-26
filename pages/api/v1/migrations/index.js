import { createRouter } from "next-connect";
import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database.js";
import { MethodNotAllowedError, InternalServerError } from "infra/errors";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

function onNoMatchHandler(req, res) {
  const publicErrorObject = new MethodNotAllowedError();
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(err, req, res) {
  const publicErrorObject = new InternalServerError({ cause: err });

  console.log("\n Erro dentro do catch do next-connect");
  console.error(publicErrorObject);

  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

async function getHandler(req, res) {
  const defaultMigrationOptions = await getMigrationsOptions();

  const pandingMigrations = await migrationRunner(defaultMigrationOptions);

  return res.status(200).json(pandingMigrations);
}

async function postHandler(req, res) {
  const defaultMigrationOptions = await getMigrationsOptions();

  const migratedMigrations = await migrationRunner({
    ...defaultMigrationOptions,
    dryRun: false,
  });

  if (migratedMigrations.length > 0) {
    return res.status(201).json(migratedMigrations);
  }

  return res.status(200).json(migratedMigrations);
}

async function getMigrationsOptions() {
  let dbClient;

  dbClient = await database.getNewClient();
  const defaultMigrationOptions = {
    dbClient: dbClient,
    databaseUrl: process.env.DATABASE_URL,
    dryRun: true,
    dir: resolve("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };

  return defaultMigrationOptions;
}
