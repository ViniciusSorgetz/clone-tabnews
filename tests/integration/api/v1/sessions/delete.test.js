import session from "models/session";
import orchestrator from "tests/orchestrator.js";
import setCookieParser from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("DELETE /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("With nonexistent session", async () => {
      const nonExistentToken =
        "6b0a33b894d0cafb16932511d329979d397481f7c4956ef5a25e8d2d897554363825c9905a37c414d9dece9fd3513642";

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          cookie: `session_id=${nonExistentToken}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se o usuário está logado e tente novamente.",
        status_code: 401,
      });
    });

    test("With expired session`", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILISECONDS * 1.5),
      });

      const createdUser = await orchestrator.createUser({});
      const createdSession = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se o usuário está logado e tente novamente.",
        status_code: 401,
      });
    });

    test("With valid sesssion", async () => {
      const createdUser = await orchestrator.createUser({});
      const createdSession = await orchestrator.createSession(createdUser.id);

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(response.status).toBe(200);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdSession.id,
        token: createdSession.token,
        user_id: createdSession.user_id,
        expires_at: responseBody.expires_at,
        created_at: createdSession.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(
        new Date(responseBody.expires_at) < createdSession.expires_at,
      ).toEqual(true);

      expect(
        new Date(responseBody.updated_at) > createdSession.updated_at,
      ).toEqual(true);

      // Set-Cookie assertions

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid", // sesion token is irrelevant
        maxAge: -1, // if the max age is equal or lower than zero,
        // the client cleans it from the cookie jar
        path: "/",
        httpOnly: true,
      });

      // Making sure the session is expired

      const response2 = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(response2.status).toBe(401);

      const responseBody2 = await response2.json();

      expect(responseBody2).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se o usuário está logado e tente novamente.",
        status_code: 401,
      });
    });
  });
});
