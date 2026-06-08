export type SavedConnection = {
  id: string
  name: string
  host: string
  port: string
  user: string
  database: string
  password: string
}

export type SavedQuery = {
  id: string
  connectionId: string
  name: string
  sql: string
}

export type QueryResult = {
  columns: string[]
  rows: Record<string, unknown>[]
}