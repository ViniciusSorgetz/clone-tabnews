import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";
import user from "models/user";
import password from "models/password";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With unique username", async () => {
      const uniqueUser1Response = await fetch(
        "http://localhost:3000/api/v1/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "uniqueUser1",
            email: "uniqueuser1@curso.dev",
            password: "senha123",
          }),
        },
      );

      expect(uniqueUser1Response.status).toBe(201);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/uniqueUser1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "uniqueUser2",
          }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        status_code: 403,
        message: "Você não possui permissão para executar esta ação.",
        action: "Verifique se o seu usuário possui a feature update:user.",
      });
    });
  });

  describe("Default user", () => {
    test("With unique 'username'", async () => {
      const uniqueUsername1 = await orchestrator.createUser({
        username: "uniqueUsername1",
        email: "uniqueusername1@curso.dev",
        activated: true,
      });

      const { token: sessionId } = await orchestrator.createSession(
        uniqueUsername1.id,
      );

      const response = await fetch(
        "http://localhost:3000/api/v1/users/uniqueUsername1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${sessionId}`,
          },
          body: JSON.stringify({
            username: "uniqueUsername2",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "uniqueUsername2",
        email: "uniqueusername1@curso.dev",
        password: responseBody.password,
        features: [
          "create:session",
          "read:user-information",
          "read:session",
          "update:user",
        ],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(typeof Date.parse(responseBody.created_at)).not.toBe(NaN);
      expect(typeof Date.parse(responseBody.updated_at)).not.toBe(NaN);

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With non-existent 'username'", async () => {
      const sessionId = await orchestrator.getValidSession();

      const response = await fetch(
        "http://localhost:3000/api/v1/users/UsuarioNaoExistente",
        {
          method: "PATCH",
          headers: {
            cookie: `session_id=${sessionId}`,
          },
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: `O usuário 'UsuarioNaoExistente' não foi encontrado.`,
        action: "Verifique se o username está correto e tente novamente.",
        status_code: 404,
      });
    });

    test("With duplicated 'username'", async () => {
      await orchestrator.createUser({
        username: "user1",
        activated: true,
      });

      const createdUser2 = await orchestrator.createUser({
        username: "user2",
        activated: true,
      });

      const { token: sessionId } = await orchestrator.createSession(
        createdUser2.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/users/user2", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: `session_id=${sessionId}`,
        },
        body: JSON.stringify({
          username: "user1",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: `O username user1 já está sendo utilizado.`,
        action: "Utilize outro username para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With `user_2` targeting `user_1`", async () => {
      await orchestrator.createUser({
        username: "user_1",
        activated: true,
      });

      const createdUser2 = await orchestrator.createUser({
        username: "user_2",
        activated: true,
      });

      const { token: sessionIdUser2 } = await orchestrator.createSession(
        createdUser2.id,
      );

      const response = await fetch(
        "http://localhost:3000/api/v1/users/user_1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${sessionIdUser2}`,
          },
          body: JSON.stringify({
            username: "user_3",
          }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        status_code: 403,
        message: "Você não possui permissão para atualizar outro usuário.",
        action:
          "Verifique se você possui a feature para autalizar outro usuário.",
      });
    });

    test("With their current 'username'", async () => {
      const { id: userId } = await orchestrator.createUser({
        username: "currentusername",
        activated: true,
      });

      const { token: sessionId } = await orchestrator.createSession(userId);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/currentusername",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${sessionId}`,
          },
          body: JSON.stringify({
            username: "currentusername",
          }),
        },
      );

      expect(response.status).toBe(200);
    });

    test("With their current 'username' and case mismatch", async () => {
      const { id: userId } = await orchestrator.createUser({
        username: "currentusername2",
        activated: true,
      });

      const { token: sessionId } = await orchestrator.createSession(userId);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/currentusername2",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${sessionId}`,
          },
          body: JSON.stringify({
            username: "CuRrEnTuSername2",
          }),
        },
      );

      expect(response.status).toBe(200);
    });

    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "email1@curso.dev",
        activated: true,
      });

      const createdUser2 = await orchestrator.createUser({
        email: "email2@curso.dev",
        activated: true,
      });

      const { token: sessionId } = await orchestrator.createSession(
        createdUser2.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${sessionId}`,
          },
          body: JSON.stringify({
            email: "email1@curso.dev",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: `O email email1@curso.dev já está sendo utilizado.`,
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With new password", async () => {
      const createdUser = await orchestrator.createUser({
        password: "newpassword1",
        activated: true,
      });

      const { token: sessionId } = await orchestrator.createSession(
        createdUser.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${sessionId}`,
          },
          body: JSON.stringify({
            password: "newpassword2",
          }),
        },
      );

      expect(response.status).toBe(200);

      const userInDatabase = await user.findOneByUsername(createdUser.username);
      const correctpasswordMatch = await password.compare(
        "newpassword2",
        userInDatabase.password,
      );

      const incorrectpasswordMatch = await password.compare(
        "newpassword1",
        userInDatabase.password,
      );

      expect(correctpasswordMatch).toBe(true);
      expect(incorrectpasswordMatch).toBe(false);
    });
  });

  describe("Privileged user", () => {
    test("With `update:user:others` targeting `defaultUser`", async () => {
      const defaultUser = await orchestrator.createUser({
        activated: true,
      });

      const privilegedUser = await orchestrator.createUser({
        activated: true,
        addedFeatures: ["update:user:others"],
      });

      const { token: privilegedUserSessionId } =
        await orchestrator.createSession(privilegedUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${defaultUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${privilegedUserSessionId}`,
          },
          body: JSON.stringify({
            username: "defaultUser__",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: defaultUser.id,
        username: "defaultUser__",
        email: defaultUser.email,
        password: defaultUser.password,
        features: defaultUser.features,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(typeof Date.parse(responseBody.created_at)).not.toBe(NaN);
      expect(typeof Date.parse(responseBody.updated_at)).not.toBe(NaN);

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
  });
});
