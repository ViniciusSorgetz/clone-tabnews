import controller from "infra/controller";
import { createRouter } from "next-connect";
import user from "models/user.js";
import session from "models/session";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(req, res) {
  const sessionToken = req.cookies.session_id;

  const foundSession = await session.findValidOneByToken(sessionToken);
  const renewedSession = await session.renew(foundSession.id);
  controller.setSessionCookie(renewedSession.token, res);

  const foundUser = await user.findOneById(foundSession.user_id);

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  res.status(200).json(foundUser);
}
