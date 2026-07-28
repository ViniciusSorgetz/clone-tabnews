import controller from "infra/controller";
import { createRouter } from "next-connect";
import user from "models/user.js";
import activation from "models/activation";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(req, res) {
  const userInputValues = req.body;
  const newUser = await user.create(userInputValues);

  const activationToken = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, activationToken);

  res.status(201).json(newUser);
}
