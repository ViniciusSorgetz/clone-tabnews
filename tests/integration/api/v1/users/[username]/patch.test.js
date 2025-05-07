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
  test("With unique 'username'", async () => {
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

    expect(response.status).toBe(200);

    const responseBody = await response.json();

    expect(responseBody).toEqual({
      id: responseBody.id,
      username: "uniqueUser2",
      email: "uniqueuser1@curso.dev",
      password: responseBody.password,
      created_at: responseBody.created_at,
      updated_at: responseBody.updated_at,
    });

    expect(uuidVersion(responseBody.id)).toEqual(4);
    expect(typeof Date.parse(responseBody.created_at)).not.toBe(NaN);
    expect(typeof Date.parse(responseBody.updated_at)).not.toBe(NaN);

    expect(responseBody.updated_at > responseBody.created_at).toBe(true);
  });

  describe("Anonymous user", () => {
    test("With non-existent 'username'", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/UsuarioNaoExistente",
        {
          method: "PATCH",
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
      });

      await orchestrator.createUser({
        username: "user2",
      });

      const response = await fetch("http://localhost:3000/api/v1/users/user2", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
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

    test("With their current 'username'", async () => {
      await orchestrator.createUser({
        username: "currentusername",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/currentusername",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "currentusername",
          }),
        },
      );

      expect(response.status).toBe(200);
    });

    test("With their current 'username' and case mismatch", async () => {
      await orchestrator.createUser({
        username: "currentusername2",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/currentusername2",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
      });

      const createdUser2 = await orchestrator.createUser({
        email: "email2@curso.dev",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
        password: "newPassword1",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: "newPassword2",
          }),
        },
      );

      expect(response.status).toBe(200);

      const userInDatabase = await user.findOneByUsername(createdUser.username);
      const correctPasswordMatch = await password.compare(
        "newPassword2",
        userInDatabase.password,
      );

      const incorrectPasswordMatch = await password.compare(
        "newPassword1",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });
  });
});
