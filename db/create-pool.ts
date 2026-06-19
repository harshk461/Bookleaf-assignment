import pg from "pg";

/** Railway public proxy and similar hosts need TLS from local CLI tools. */
export function needsRemoteSsl(connectionString: string): boolean {
  return (
    connectionString.includes("rlwy.net") ||
    connectionString.includes("railway.internal") ||
    connectionString.includes("sslmode=")
  );
}

/** pg v8+ treats sslmode=require as verify-full — strip it and set ssl explicitly. */
export function prepareConnection(connectionString: string): {
  connectionString: string;
  ssl?: pg.ConnectionConfig["ssl"];
} {
  if (!needsRemoteSsl(connectionString)) {
    return { connectionString };
  }

  const connectionStringWithoutSslMode = connectionString
    .replace(/([?&])sslmode=[^&]*/g, "$1")
    .replace(/([?&])uselibpqcompat=[^&]*/g, "$1")
    .replace(/[?&]$/, "");

  return {
    connectionString: connectionStringWithoutSslMode,
    ssl: { rejectUnauthorized: false },
  };
}

export function createPgPool(connectionString: string): pg.Pool {
  const { connectionString: conn, ssl } = prepareConnection(connectionString);
  return new pg.Pool({
    connectionString: conn,
    ...(ssl ? { ssl } : {}),
  });
}
