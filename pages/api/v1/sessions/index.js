import controller from "infra/controller";
import { createRouter } from "next-connect";
import authentication from "models/authentication";
import session from "models/session";
import * as cookie from "cookie";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(req, res) {
  const { email, password } = req.body;

  const authenticatedUser = await authentication.validate(email, password);

  const newSession = await session.create(authenticatedUser.id);

  const setCookie = cookie.serialize("session_id", newSession.token, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  res.setHeader("Set-Cookie", setCookie);

  return res.status(201).json(newSession);
}
