test("GET to /api/v1/status shoudl return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  expect(response.status).toBe(200);

  const responseBody = await response.json();
  expect(responseBody.updated_at).toBeDefined();

  const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
  expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

  expect(responseBody.postgres_version).toBeDefined();
  expect(typeof responseBody.postgres_version).toEqual("string");

  expect(responseBody.max_connections).toBeDefined();
  const maxConnectionsNumber = Number(responseBody.max_connections);
  expect(String(maxConnectionsNumber)).toEqual(responseBody.max_connections);

  expect(responseBody.connections).toBeDefined();
  expect(typeof responseBody.connections).toEqual("number");

  console.log(responseBody);
});
