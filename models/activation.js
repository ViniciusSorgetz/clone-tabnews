import database from "infra/database";
import email from "infra/email";
import { NotFoundError, ValidationError } from "infra/errors";
import webserver from "infra/webserver";
import user from "./user";

const EXPIRATION_IN_MILLISECONDS = 1000 * 60 * 15; // 15 minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const createdToken = await runInsertQuery(userId, expiresAt);

  return createdToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at, updated_at, created_at)
        VALUES
          ($1, $2, $3, $4)
        RETURNING
          *
      ;`,
      values: [userId, expiresAt, new Date(), new Date()],
    });

    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "Treenews <contato@treenews.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no Treenews!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no Treenews:

link: ${webserver.origin}/cadastro/ativar/${activationToken.id}

atensiosamente, equipe do Treenews.
`,
  });
}

async function findValidTokenById(token) {
  const activationToken = await runSelectQuery(token);
  validateToken(activationToken);

  return activationToken;

  async function runSelectQuery(token) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          id = $1
        LIMIT
          1
        ;`,
      values: [token],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: `Token não encontrado.`,
        action: `Verifique se o token está correto e tente novamente.`,
      });
    }

    return results.rows[0];
  }

  async function validateToken() {
    if (activationToken.used_at) {
      throw new ValidationError({
        message: "O token já foi utilizado.",
        action: "Tente utilizar outro token de ativação.",
      });
    }

    if (activationToken.expiration_date < Date.now()) {
      throw new ValidationError({
        message: "O token já expirou.",
        action: "Tente receber outro token de ativação.",
      });
    }
  }
}

async function markTokenAsUsed(token) {
  const updatedToken = await runUpdateQuery(token);

  return updatedToken;

  async function runUpdateQuery(token) {
    const results = await database.query({
      text: `
        UPDATE
          user_activation_tokens
        SET
          used_at = $1,
          updated_at = $1
        WHERE
          id = $2
        RETURNING
          *
      ;`,
      values: [new Date(), token],
    });

    return results.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const activatedUser = await user.setFeaturesByUserId(userId, [
    "create:session",
  ]);
  return activatedUser;
}

const activation = {
  create,
  sendEmailToUser,
  findValidTokenById,
  markTokenAsUsed,
  activateUserByUserId,
};

export default activation;
