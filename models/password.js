import bcryptjs from "bcryptjs";

async function hash(password) {
  const rounds = getNumberOfRounds();
  return await bcryptjs.hash(password, rounds);
}

function getNumberOfRounds() {
  if (process.env.NODE_ENV === "production") {
    return 14;
  }
  return 1;
}

async function compare(password, storedPassword) {
  return await bcryptjs.compare(password, storedPassword);
}

const passwordModel = {
  hash,
  compare,
};

export default passwordModel;
