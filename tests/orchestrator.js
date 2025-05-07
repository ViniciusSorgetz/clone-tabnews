import retry from "async-retry";
import { faker } from "@faker-js/faker";

import database from "infra/database.js";
import migrator from "models/migrator.js";
import user from "models/user.js";

async function waitForAllServices() {
  await waitForWebServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");
      if (response.status !== 200) {
        throw Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query("DROP SCHEMA PUBLIC CASCADE; CREATE SCHEMA PUBLIC;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser({ username, email, password }) {
  const createdUser = await user.create({
    username: username || faker.internet.username().replace(/[_.-]/g, ""),
    email: email || faker.internet.email(),
    password: password || "validpassword",
  });

  return createdUser;
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
};

export default orchestrator;
