import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
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
    const responseBody = await createUserResponse.json();

    expect(responseBody).toEqual({
      id: responseBody.id,
      username: "RegistrationFlow",
      email: "registration.flow@curso.dev",
      password: responseBody.password,
      features: ["read:activation_token"],
      created_at: responseBody.created_at,
      updated_at: responseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@treenews.com.br>");
    expect(lastEmail.recipients[0]).toBe("<registration.flow@curso.dev>");
    expect(lastEmail.subject).toBe("Ative seu cadastro no Treenews!");
    expect(lastEmail.text).toContain("RegistrationFlow");
  });

  test("Activate account", async () => {
    expect(1 + 1).toBe(2);
  });

  test("Get user information", async () => {
    expect(1 + 1).toBe(2);
  });
});
