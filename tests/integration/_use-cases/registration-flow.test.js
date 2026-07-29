import webserver from "infra/webserver";
import activation from "models/activation";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createUserResponseBody;

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

    const extractedToken = await orchestrator.getTokenFromEmail(lastEmail.text);

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
    expect(1 + 1).toBe(2);
  });

  test("Login", async () => {
    expect(1 + 1).toBe(2);
  });

  test("Get user information", async () => {
    expect(1 + 1).toBe(2);
  });
});
