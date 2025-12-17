import session from "models/session";
import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  describe("Default user", () => {
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "UserWithValidSession",
      });

      const createdSession = await orchestrator.createSession(createdUser.id);

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const cacheControl = response.headers.get("Cache-Control");
      expect(cacheControl).toBe(
        "no-store, no-cache, max-age=0, must-revalidate",
      );

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserWithValidSession",
        email: createdUser.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(typeof Date.parse(responseBody.created_at)).not.toBe(NaN);
      expect(typeof Date.parse(responseBody.updated_at)).not.toBe(NaN);

      // session renewed assertions
      const renewedSession = await session.findValidOneByToken(
        createdSession.token,
      );

      expect(renewedSession.expires_at > createdSession.expires_at).toEqual(
        true,
      );
      expect(renewedSession.updated_at > createdSession.updated_at).toEqual(
        true,
      );

      // Set-Cookie assertions

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: createdSession.token,
        maxAge: session.EXPIRATION_IN_MILISECONDS / 1000,
        path: "/",
        httpOnly: true,
      });
    });

    test("With valid 15 days old session", async () => {
      // as the EXPIRATION_IN_MILISECONDS is 30 days, half is 15 days
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILISECONDS / 2),
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithValidOldSession",
      });

      const createdSession = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserWithValidOldSession",
        email: createdUser.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody.id)).toEqual(4);
      expect(typeof Date.parse(responseBody.created_at)).not.toBe(NaN);
      expect(typeof Date.parse(responseBody.updated_at)).not.toBe(NaN);

      // session renewed assertions
      const renewedSession = await session.findValidOneByToken(
        createdSession.token,
      );

      const renewedExpiresAt = new Date(renewedSession.expires_at);
      const oldExpiresAt = new Date(createdSession.expires_at);

      renewedExpiresAt.setMilliseconds(0);
      oldExpiresAt.setMilliseconds(0);

      // newed expires_at value is 15 days greater than the old value
      expect(renewedExpiresAt - oldExpiresAt).toEqual(
        session.EXPIRATION_IN_MILISECONDS / 2,
      );

      const renewedUpdatedAt = new Date(renewedSession.updated_at);
      const oldUpdatedAt = new Date(createdSession.updated_at);

      renewedUpdatedAt.setMilliseconds(0);
      oldUpdatedAt.setMilliseconds(0);

      console.log(renewedUpdatedAt);
      console.log(oldUpdatedAt);

      expect(renewedUpdatedAt - oldUpdatedAt).toEqual(
        session.EXPIRATION_IN_MILISECONDS / 2,
      );

      // Set-Cookie assertions

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: createdSession.token,
        maxAge: session.EXPIRATION_IN_MILISECONDS / 1000,
        path: "/",
        httpOnly: true,
      });
    });

    test("With nonexistent session", async () => {
      const nonExistentToken =
        "6b0a33b894d0cafb16932511d329979d397481f7c4956ef5a25e8d2d897554363825c9905a37c414d9dece9fd3513641";

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${nonExistentToken}`,
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

    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILISECONDS),
      });

      const createdUser = await orchestrator.createUser({
        username: "UserWithExpiredSession",
      });

      const createdSession = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${createdSession.token}`,
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
  });
});
