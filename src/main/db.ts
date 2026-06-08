import mysql from 'mysql2/promise';

export type DbQueryParams = {
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
  query: string;
};

export type DbQueryResult = {
  columns: string[];
  rows: Record<string, unknown>[];
};

export async function runQuery(params: DbQueryParams): Promise<DbQueryResult> {
  const connection = await mysql.createConnection({
    host: params.host,
    port: params.port,
    user: params.user,
    password: params.password,
    database: params.database || undefined,

    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    const [rows, fields] = await connection.query(params.query);

    return {
      columns: fields.map((field) => field.name),
      rows: Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [],
    };
  } finally {
    await connection.end();
  }
}