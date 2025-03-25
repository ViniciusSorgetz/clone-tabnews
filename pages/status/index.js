import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <DatabaseInformation />
    </>
  );
}

function UpdatedAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedAtText = "Carregando...";

  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");
  }

  return <div>Última atualização: {updatedAtText}</div>;
}

function DatabaseInformation() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  const loadingMessage = "Carregando";

  let versionText = loadingMessage;
  let maxConnectionsText = loadingMessage;
  let connections = loadingMessage;

  if (!isLoading && data) {
    versionText = data.dependencies.database.version;
    maxConnectionsText = data.dependencies.database.max_connections;
    connections = data.dependencies.database.connections;
  }

  return (
    <>
      <h2>Database</h2>
      <div>Versão: {versionText}</div>
      <div>Conexões máximas: {maxConnectionsText}</div>
      <div>Conexões abertas: {connections}</div>
    </>
  );
}
