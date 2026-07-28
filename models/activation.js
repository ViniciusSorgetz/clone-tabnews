import database from "infra/database";
import email from "infra/email";
import webserver from "infra/webserver";

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

async function findOneByUserId(userId) {
  const activationToken = await runSelectQuery(userId);

  return activationToken;

  async function runSelectQuery(userId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          user_id = $1
        LIMIT
          1
        ;`,
      values: [userId],
    });

    return results.rows[0];
  }
}

const activation = {
  create,
  sendEmailToUser,
  findOneByUserId,
};

export default activation;
