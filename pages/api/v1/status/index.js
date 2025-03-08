import database from "infra/database.js";

async function status(req, res) {
  const updatedAt = new Date().toISOString();
  const postgresVersion = await database.query("SELECT version() AS version;");
  const maxConnections = await database.query("SHOW max_connections;");
  const connections = await database.query(
    "SELECT * FROM pg_stat_activity AS connections;",
  );

  res.status(200).json({
    postgres_version: postgresVersion.rows[0].version,
    max_connections: maxConnections.rows[0].max_connections,
    connections: connections.rowCount,
    updated_at: updatedAt,
  });
}

export default status;
