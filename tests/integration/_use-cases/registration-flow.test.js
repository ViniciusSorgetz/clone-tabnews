import webserver from "infra/webserver";
import activation from "models/activation";
import user from "models/user";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createUserResponseBody;
  let extractedToken;

  test("Create user account", async () => {
    const createUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "RegistrationFlow",
          email: "registration.flow@curso.dev",
          password: "senha123",
        }),
      },
    );

    expect(createUserResponse.status).toBe(201);
    createUserResponseBody = await createUserResponse.json();

    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: "RegistrationFlow",
      email: "registration.flow@curso.dev",
      password: createUserResponseBody.password,
      features: ["read:activation_token"],
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    extractedToken = await orchestrator.getTokenFromEmail(lastEmail.text);

    expect(lastEmail.text).toContain(
      `${webserver.origin}/cadastro/ativar/${extractedToken}`,
    );

    const activationToken = await activation.findValidTokenById(extractedToken);

    expect(lastEmail.sender).toBe("<contato@treenews.com.br>");
    expect(lastEmail.recipients[0]).toBe("<registration.flow@curso.dev>");
    expect(lastEmail.subject).toBe("Ative seu cadastro no Treenews!");
    expect(lastEmail.text).toContain("RegistrationFlow");
    expect(activationToken.user_id).toEqual(createUserResponseBody.id);
  });

  test("Activate account", async () => {
    const activateTokenResponse = await fetch(
      `
      http://localhost:3000/api/v1/activations/${extractedToken}`,
      {
        method: "PATCH",
      },
    );

    expect(activateTokenResponse.status).toBe(200);

    const activateTokenResponseBody = await activateTokenResponse.json();

    expect(activateTokenResponseBody.used_at).toBeTruthy();

    const activatedUser = await user.findOneByUsername("RegistrationFlow");
    expect(activatedUser.features).toEqual(["create:session"]);
  });

  test("Login", async () => {
    const createSessionResponse = await fetch(
      "http://localhost:3000/api/v1/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "registration.flow@curso.dev",
          password: "senha123",
        }),
      },
    );

    expect(createSessionResponse.status).toBe(201);

    const createSessionResponseBody = await createSessionResponse.json();

    expect(createSessionResponseBody.user_id).toEqual(
      createUserResponseBody.id,
    );
  });

  test("Get user information", async () => {
    expect(1 + 1).toBe(2);
  });
});
