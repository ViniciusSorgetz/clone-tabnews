import database from "infra/database";
import passwordModel from "models/password.js";
import { ValidationError, NotFoundError } from "infra/errors";

async function create({ username, email, password }) {
  // username validation
  await validateUniqueField("username", username);
  // email validation
  await validateUniqueField("email", email);

  // password creation
  const hashedPassword = await hashPassowrdInObject(password);

  const newUser = await runInsertQuery(username, email, hashedPassword);
  return newUser;

  async function runInsertQuery(username, email, password) {
    const results = await database.query({
      text: `
          INSERT INTO 
            users (username, email, password, created_at, updated_at) 
          VALUES 
            ($1, $2, $3, $4, $5)
          RETURNING
            *
          ;`,
      values: [username, email, password, new Date(), new Date()],
    });
    return results.rows[0];
  }
}

async function findOneById(userId) {
  const userFound = await runSelectQuery(userId);
  return userFound;

  async function runSelectQuery(id) {
    const results = await database.query({
      text: `
          SELECT 
            *
          FROM 
            users
          WHERE
            id = $1
          LIMIT
            1
          ;`,
      values: [id],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: `O usuário '${id}' não foi encontrado.`,
        action: `Verifique se o id está correto e tente novamente.`,
      });
    }

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

async function findOneByEmail(email) {
  const userFound = await runSelectQuery(email);
  return userFound;

  async function runSelectQuery(email) {
    const results = await database.query({
      text: `
          SELECT 
            *
          FROM 
            users
          WHERE
            LOWER(email) = LOWER($1)
          LIMIT
            1
          ;`,
      values: [email],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: `O usuário '${email}' não foi encontrado.`,
        action: `Verifique se o email está correto e tente novamente.`,
      });
    }

    return results.rows[0];
  }
}

async function update(currentUsername, { username, email, password }) {
  const currentUser = await findOneByUsername(currentUsername);

  if (
    username &&
    username.toLowerCase() != currentUser.username.toLowerCase()
  ) {
    await validateUniqueField("username", username);
  }

  if (email && email.toLowerCase() != currentUser.email.toLowerCase()) {
    await validateUniqueField("email", email);
  }

  if (password) {
    password = await hashPassowrdInObject(password);
  }

  const userWithNewValues = {
    ...currentUser,
    username: username ? username : currentUser.username,
    email: email ? email : currentUser.email,
    password: password ? password : currentUser.password,
  };

  const updatedUser = await runUpdateQuery(userWithNewValues);
  return updatedUser;

  async function runUpdateQuery({ id, username, email, password }) {
    const results = await database.query({
      text: `
        UPDATE
          users
        SET
          username = $2,
          email = $3,
          password = $4,
          updated_at = $5
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [id, username, email, password, new Date()],
    });

    return results.rows[0];
  }
}

async function validateUniqueField(field, value) {
  const results = await database.query({
    text: `
      SELECT
        ${field}
      FROM
        users
      WHERE
        LOWER(${field}) = LOWER($1)
      ;`,
    values: [value],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: `O ${field} ${value} já está sendo utilizado.`,
      action: `Utilize outro ${field} para realizar esta operação.`,
    });
  }
}

async function hashPassowrdInObject(password) {
  return await passwordModel.hash(password);
}

const user = {
  create,
  findOneByUsername,
  findOneByEmail,
  findOneById,
  update,
};

export default user;
