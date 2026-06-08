import mysql from 'mysql2/promise'

export type DbQueryParams = {
  host: string
  port: number
  user: string
  password: string
  database?: string
  query: string
}

export type TableColumn = {
  name: string
  dataType: string
  columnType: string
  isNullable: boolean
  columnKey: string
}

export type DbQueryResult = {
  columns: string[]
  rows: Record<string, unknown>[]
}

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
  })

  try {
    const [rows, fields] = await connection.query(params.query)

    return {
      columns: fields.map((field) => field.name),
      rows: Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [],
    }
  } finally {
    await connection.end()
  }
}

export async function listTables(
  params: Omit<DbQueryParams, 'query'>
): Promise<string[]> {
  const result = await runQuery({
    ...params,
    query: `
      SELECT table_name AS tableName
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      ORDER BY table_name ASC
    `,
  })

  return result.rows
    .map((row) => String(row.tableName))
    .filter(Boolean)
}

export async function getTablePreview(
  params: Omit<DbQueryParams, 'query'> & { tableName: string }
): Promise<DbQueryResult> {
  const safeTableName = escapeIdentifier(params.tableName)

  return await runQuery({
    host: params.host,
    port: params.port,
    user: params.user,
    password: params.password,
    database: params.database,
    query: `SELECT * FROM ${safeTableName} ORDER BY id DESC LIMIT 100`,
  })
}

export async function getTableColumns(
  params: Omit<DbQueryParams, 'query'> & { tableName: string }
): Promise<TableColumn[]> {
  const result = await runQuery({
    host: params.host,
    port: params.port,
    user: params.user,
    password: params.password,
    database: params.database,
    query: `
      SELECT
        column_name AS name,
        data_type AS dataType,
        column_type AS columnType,
        is_nullable AS isNullable,
        column_key AS columnKey
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = ${escapeSqlString(params.tableName)}
      ORDER BY ordinal_position ASC
    `,
  })

  return result.rows.map((row) => ({
    name: String(row.name),
    dataType: String(row.dataType),
    columnType: String(row.columnType),
    isNullable: String(row.isNullable).toUpperCase() === 'YES',
    columnKey: String(row.columnKey ?? ''),
  }))
}

function escapeIdentifier(identifier: string): string {
  return `\`${identifier.replaceAll('`', '``')}\``
}

function escapeSqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}