import database from "infra/database";
import { ValidationError, NotFoundError } from "infra/errors";

async function create({ username, email, password }) {
  // email validation
  await validateUniqueField("email", email);
  // username validation
  await validateUniqueField("username", username);

  const newUser = await runInsertQuery(username, email, password);
  return newUser;

  async function validateUniqueField(field, email) {
    const results = await database.query({
      text: `
        SELECT
          ${field}
        FROM
          users
        WHERE
          LOWER(${field}) = LOWER($1)
        ;`,
      values: [email],
    });

    if (results.rowCount > 0) {
      throw new ValidationError({
        message: `O ${field} ${email} já está sendo utilizado`,
        action: `Utilize outro ${field} para realizar o cadastro`,
      });
    }
  }

  async function runInsertQuery(username, email, password) {
    const results = await database.query({
      text: `
          INSERT INTO 
            users (username, email, password) 
          VALUES 
            ($1, $2, $3)
          RETURNING
            *
          ;`,
      values: [username, email, password],
    });
    return results.rows[0];
  }
}

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);
  return userFound;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
          SELECT 
            *
          FROM 
            users
          WHERE
            LOWER(username) = LOWER($1)
          LIMIT
            1
          ;`,
      values: [username],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: `O usuário '${username}' não foi encontrado.`,
        action: `Verifique se o username está correto e tente novamente.`,
      });
    }

    return results.rows[0];
  }
}

const user = {
  create,
  findOneByUsername,
};

export default user;
