import controller from "infra/controller";
import { createRouter } from "next-connect";
import activation from "models/activation";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(req, res) {
  const activationToken = req.query.activation_token;
  const foundToken = await activation.findValidTokenById(activationToken);
  const usedActivationToken = await activation.markTokenAsUsed(activationToken);
  await activation.activateUserByUserId(foundToken.user_id);
  res.status(200).json(usedActivationToken);
}
