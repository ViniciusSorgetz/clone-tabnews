import controller from "infra/controller";
import { createRouter } from "next-connect";
import authentication from "models/authentication";
import session from "models/session";
import authorization from "models/authorization";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

// authentication middleware
router.use(controller.injectAnonymousOrUser);
// authorization middleware
router.post(controller.canRequest("create:session"), postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(req, res) {
  const { email, password } = req.body;

  const authenticatedUser = await authentication.validate(email, password);

  const newSession = await session.create(authenticatedUser.id);
  controller.setSessionCookie(newSession.token, res);

  if (!authorization.can(authenticatedUser, "create:session")) {
    throw new ForbiddenError({
      message: "Você não possui permissão para fazer login.",
      action: "Contate o suporte caso você acredite que isso seja um erro.",
    });
  }

  return res.status(201).json(newSession);
}

async function deleteHandler(req, res) {
  const sessionToken = req.cookies.session_id;

  const foundSession = await session.findValidOneByToken(sessionToken);
  const expiredSession = await session.expireById(foundSession.id);
  controller.clearSessionCookie(res);

  return res.status(200).json(expiredSession);
}
