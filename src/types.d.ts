export {}

declare global {
  interface Window {
    dbApi: {
      query: (params: unknown) => Promise<{
        columns: string[]
        rows: Record<string, unknown>[]
      }>
      listTables: (params: unknown) => Promise<string[]>
      getTablePreview: (params: unknown) => Promise<{
        columns: string[]
        rows: Record<string, unknown>[]
      }>
      getTableColumns: (params: unknown) => Promise<
        {
          name: string
          dataType: string
          columnType: string
          isNullable: boolean
          columnKey: string
        }[]
      >
    }
  }
}