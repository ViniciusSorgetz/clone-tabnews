import controller from "infra/controller";
import { createRouter } from "next-connect";
import authentication from "models/authentication";
import session from "models/session";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(req, res) {
  const { email, password } = req.body;

  const authenticatedUser = await authentication.validate(email, password);

  const newSession = await session.create(authenticatedUser.id);
  controller.setSessionCookie(newSession.token, res);

  return res.status(201).json(newSession);
}
