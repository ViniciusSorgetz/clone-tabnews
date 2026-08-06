import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import user from "models/user";
import password from "models/password";
import activation from "models/activation";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "rex",
          email: "rex@curso.dev",
          password: "senha123",
        }),
      });

      expect(response.status).toBe(201);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "rex",
        email: "rex@curso.dev",
        password: responseBody.password,
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(typeof Date.parse(responseBody.created_at)).not.toBe(NaN);
      expect(typeof Date.parse(responseBody.updated_at)).not.toBe(NaN);

      const userInDatabase = await user.findOneByUsername("rex");
      const correctpasswordMatch = await password.compare(
        "senha123",
        userInDatabase.password,
      );

      const incorrectpasswordMatch = await password.compare(
        "senha Incorreta!",
        userInDatabase.password,
      );

      expect(correctpasswordMatch).toBe(true);
      expect(incorrectpasswordMatch).toBe(false);
    });

    test("With duplicated email", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "rex1",
          email: "rexemail@curso.dev",
          password: "senha123",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "rex2",
          email: "Rexemail@curso.dev",
          password: "senha123",
        }),
      });

      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ValidationError",
        message: `O email Rexemail@curso.dev já está sendo utilizado.`,
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With duplicated username", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "littleRex",
          email: "littlerex1@curso.dev",
          password: "senha123",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "littleRex",
          email: "littlerex2@curso.dev",
          password: "senha123",
        }),
      });

      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ValidationError",
        message: `O username littleRex já está sendo utilizado.`,
        action: "Utilize outro username para realizar esta operação.",
        status_code: 400,
      });
    });
  });

  describe("Default user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "default-user",
          email: "default-user@curso.dev",
          password: "senha123",
        }),
      });

      expect(response.status).toBe(201);
      const responseBody = await response.json();

      await activation.activateUserByUserId(responseBody.id);

      const { token: sessionId } = await orchestrator.createSession(
        responseBody.id,
      );

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `session_id=${sessionId}`,
        },
        body: JSON.stringify({
          username: "default-user2",
          email: "default-user2@curso.dev",
          password: "senha123",
        }),
      });

      expect(response2.status).toBe(403);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ForbiddenError",
        status_code: 403,
        message: "Você não possui permissão para executar esta ação.",
        action: "Verifique se o seu usuário possui a feature create:user.",
      });
    });
  });
});
