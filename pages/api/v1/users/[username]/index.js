import controller from "infra/controller";
import { createRouter } from "next-connect";
import user from "models/user.js";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(req, res) {
  const username = req.query.username;
  const userFound = await user.findOneByUsername(username);
  res.status(200).json(userFound);
}
