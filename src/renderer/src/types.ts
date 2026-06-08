export type SavedConnection = {
  id: string
  name: string
  host: string
  port: string
  user: string
  database: string
  password?: string
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

export type QueryDraft = {
  name: string
  sql: string
  result?: QueryResult
}

export type TableColumn = {
  name: string
  dataType: string
  columnType: string
  isNullable: boolean
  columnKey: string
}

export type LivePanel = 'query' | 'explore'