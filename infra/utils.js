function extractUuid(text) {
  const regex =
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}/g;
  const result = text.match(regex);

  if (result?.length !== 1) {
    return null;
  }

  return result[0];
}

const utils = {
  extractUuid,
};

export default utils;
