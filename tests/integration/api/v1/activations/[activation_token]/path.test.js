import activation from "models/activation";
import user from "models/user";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/activations", () => {
  describe("Default user", () => {
    test("With a valid token, but logged in", async () => {
      const createdUser = await orchestrator.createUser({
        activated: true,
      });

      const { id: activationToken } = await activation.create(createdUser.id);

      const { token: sessionId } = await orchestrator.createSession(
        createdUser.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken}`,
        {
          method: "PATCH",
          headers: {
            cookie: `session_id=${sessionId}`,
          },
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action:
          "Verifique se o seu usuário possui a feature read:activation_token.",
        status_code: 403,
      });
    });
  });

  describe("Anonymous user", () => {
    test("With a valid token", async () => {
      const createdUser = await orchestrator.createUser({});

      const { id: activationToken } = await activation.create(createdUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: activationToken,
        used_at: responseBody.used_at,
        user_id: createdUser.id,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toBe(activation.EXPIRATION_IN_MILLISECONDS);

      const activatedUser = await user.findOneById(createdUser.id);

      expect(activatedUser.features).toEqual([
        "create:session",
        "read:user-information",
        "read:session",
        "update:user",
      ]);
    });

    test("With a valid token, but already activated user", async () => {
      const activatedUser = await orchestrator.createUser({
        activated: true,
      });
      const { id: activationToken } = await activation.create(activatedUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        status_code: 403,
        message: "Você não pode mais utilizar tokens de ativação.",
        action:
          "Entre em contato com o suporte se você acha que isso é um erro.",
      });
    });

    test("With nonexistent token", async () => {
      const response = await fetch(
        `http://localhost:3000/api/v1/activations/7d0328d1-536f-4706-8709-0e695ff75ed6`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        status_code: 404,
        message: `Token não encontrado.`,
        action: `Verifique se o token está correto e tente novamente.`,
      });
    });

    test("With expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser({});
      const { id: activationToken } = await activation.create(createdUser.id);

      jest.useRealTimers();

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toEqual(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        status_code: 400,
        message: "O token já expirou.",
        action: `Tente receber outro token de ativação.`,
      });
    });
  });

  test("With already used token", async () => {
    const createdUser = await orchestrator.createUser({});
    const { id: activationToken } = await activation.create(createdUser.id);

    const response1 = await fetch(
      `http://localhost:3000/api/v1/activations/${activationToken}`,
      {
        method: "PATCH",
      },
    );

    expect(response1.status).toEqual(200);

    const response2 = await fetch(
      `http://localhost:3000/api/v1/activations/${activationToken}`,
      {
        method: "PATCH",
      },
    );

    expect(response2.status).toEqual(400);

    const responseBody = await response2.json();

    expect(responseBody).toEqual({
      name: "ValidationError",
      status_code: 400,
      message: "O token já foi utilizado.",
      action: "Tente utilizar outro token de ativação.",
    });
  });

  test("With wrong format", async () => {
    const response = await fetch(
      `http://localhost:3000/api/v1/activations/formato-errado`,
      {
        method: "PATCH",
      },
    );

    expect(response.status).toBe(400);

    const responseBody = await response.json();

    expect(responseBody).toEqual({
      name: "ValidationError",
      status_code: 400,
      message: "O token não atende ao formato necessário.",
      action: "Tente utilizar outro token de ativação.",
    });
  });
});
