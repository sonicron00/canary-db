import { useEffect, useMemo, useState } from 'react'
import liveCanaryLogo from './assets/live-canary.png'
import './App.css';

import type { LivePanel, QueryDraft, QueryResult, SavedConnection, SavedQuery, TableColumn } from '../src/renderer/src/types';
import {
  loadConnections,
  loadQueries,
  saveConnections,
  saveQueries,
} from '../src/renderer/src/storage';

type Screen = 'home' | 'live'

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('home')
  const [livePanel, setLivePanel] = useState<LivePanel>('query')
  const [queryDraft, setQueryDraft] = useState<QueryDraft | null>(null)

  const [connections, setConnections] = useState<SavedConnection[]>(() =>
    loadConnections()
  )

  const [queries, setQueries] = useState<SavedQuery[]>(() => loadQueries())

  const [activeConnection, setActiveConnection] =
    useState<SavedConnection | null>(null)

  function handleSaveConnection(connection: SavedConnection): void {
    const exists = connections.some((item) => item.id === connection.id)

    const nextConnections = exists
      ? connections.map((item) => (item.id === connection.id ? connection : item))
      : [...connections, connection]

    setConnections(nextConnections)
    saveConnections(nextConnections)
  }

  function handleDeleteConnection(connectionId: string): void {
    const nextConnections = connections.filter((item) => item.id !== connectionId)
    const nextQueries = queries.filter((item) => item.connectionId !== connectionId)

    setConnections(nextConnections)
    setQueries(nextQueries)

    saveConnections(nextConnections)
    saveQueries(nextQueries)
  }

  function handleChooseConnection(connection: SavedConnection): void {
    setActiveConnection(connection)
    setLivePanel('query')
    setScreen('live')
  }

  function handleReturnHome(): void {
    setActiveConnection(null)
    setQueryDraft(null)
    setScreen('home')
  }

  function handleSaveQuery(query: SavedQuery): void {
    const exists = queries.some((item) => item.id === query.id)

    const nextQueries = exists
      ? queries.map((item) => (item.id === query.id ? query : item))
      : [...queries, query]

    setQueries(nextQueries)
    saveQueries(nextQueries)
  }

  return (
    <main className="app">
      {screen === 'home' && (
        <>
          <AppHeader />

          <ConnectionScreen
            connections={connections}
            onSaveConnection={handleSaveConnection}
            onDeleteConnection={handleDeleteConnection}
            onChooseConnection={handleChooseConnection}
          />
        </>
      )}

      {screen === 'live' && activeConnection && (
      <LiveConnectionScreen
        connection={activeConnection}
        livePanel={livePanel}
        onSetLivePanel={setLivePanel}
        onReturnHome={handleReturnHome}
        queries={queries.filter(
          (query) => query.connectionId === activeConnection.id
        )}
        onSaveQuery={handleSaveQuery}
        queryDraft={queryDraft}
        onSetQueryDraft={setQueryDraft}
      />
      )}
    </main>
  )
}

function AppHeader(): React.JSX.Element {
  return (
    <header className="app-header">
      <img src={liveCanaryLogo} className="app-logo" alt="Canary DB logo" />

      <div>
        <h1>Canary DB</h1>
        <p>Lightweight but handy MySQL client</p>
      </div>
    </header>
  )
}

type ConnectionScreenProps = {
  connections: SavedConnection[]
  onSaveConnection: (connection: SavedConnection) => void
  onDeleteConnection: (connectionId: string) => void
  onChooseConnection: (connection: SavedConnection) => void
}

function ConnectionScreen({
  connections,
  onSaveConnection,
  onDeleteConnection,
  onChooseConnection,
}: ConnectionScreenProps): React.JSX.Element {
  const [selectedConnectionId, setSelectedConnectionId] = useState(
    connections[0]?.id ?? ''
  )

  const selectedConnection = connections.find(
    (connection) => connection.id === selectedConnectionId
  )

  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('3306')
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [database, setDatabase] = useState('')

  function loadSelectedIntoForm(): void {
    if (!selectedConnection) return

    setEditingConnectionId(selectedConnection.id)
    setName(selectedConnection.name)
    setHost(selectedConnection.host)
    setPort(selectedConnection.port)
    setUser(selectedConnection.user)
    setPassword(selectedConnection.password ?? '')
    setDatabase(selectedConnection.database)
  }

  function clearForm(): void {
    setEditingConnectionId(null)
    setName('')
    setHost('')
    setPort('3306')
    setUser('')
    setPassword('')
    setDatabase('')
  }

  function saveConnection(): void {
    const connection: SavedConnection = {
      id: editingConnectionId ?? crypto.randomUUID(),
      name,
      host,
      port,
      user,
      password,
      database,
    }

    onSaveConnection(connection)
    setSelectedConnectionId(connection.id)
    setEditingConnectionId(connection.id)
  }

  return (
    <section className="screen home-screen">
      <div className="panel">
        <h2>Open connection</h2>

        {connections.length === 0 ? (
          <p>No saved connections yet. Create one below.</p>
        ) : (
          <>
            <label>
              Saved connections
              <select
                value={selectedConnectionId}
                onChange={(event) => setSelectedConnectionId(event.target.value)}
              >
                {connections.map((connection) => (
                  <option key={connection.id} value={connection.id}>
                    {connection.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="button-row">
              <button
                onClick={() =>
                  selectedConnection && onChooseConnection(selectedConnection)
                }
                disabled={!selectedConnection}
              >
                Connect
              </button>

              <button
                type="button"
                className="secondary"
                onClick={loadSelectedIntoForm}
                disabled={!selectedConnection}
              >
                Edit
              </button>

              <button
                type="button"
                className="danger"
                onClick={() =>
                  selectedConnection && onDeleteConnection(selectedConnection.id)
                }
                disabled={!selectedConnection}
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      <div className="panel">
        <h2>{editingConnectionId ? 'Edit connection' : 'Create connection'}</h2>

        <label>
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Production RDS"
          />
        </label>

        <label>
          Host
          <input
            value={host}
            onChange={(event) => setHost(event.target.value)}
            placeholder="your-rds-endpoint.amazonaws.com"
          />
        </label>

        <label>
          Port
          <input
            value={port}
            onChange={(event) => setPort(event.target.value)}
          />
        </label>

        <label>
          User
          <input
            value={user}
            onChange={(event) => setUser(event.target.value)}
          />
        </label>

        <label>
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Not secure yet — Keychain later"
          />
        </label>

        <label>
          Database
          <input
            value={database}
            onChange={(event) => setDatabase(event.target.value)}
            placeholder="optional"
          />
        </label>

        <div className="button-row">
          <button
            type="button"
            onClick={saveConnection}
            disabled={!name || !host || !port || !user}
          >
            Save connection
          </button>

          <button type="button" className="secondary" onClick={clearForm}>
            Clear
          </button>
        </div>
      </div>
    </section>
  )
}

type LiveConnectionScreenProps = {
  connection: SavedConnection
  livePanel: LivePanel
  onSetLivePanel: (panel: LivePanel) => void
  onReturnHome: () => void
  queries: SavedQuery[]
  onSaveQuery: (query: SavedQuery) => void
  queryDraft: QueryDraft | null
  onSetQueryDraft: (draft: QueryDraft | null) => void
}

function LiveConnectionScreen({
  connection,
  livePanel,
  onSetLivePanel,
  onReturnHome,
  queries,
  onSaveQuery,
  queryDraft,
  onSetQueryDraft,
}: LiveConnectionScreenProps): React.JSX.Element {
  const [latestExploreDraft, setLatestExploreDraft] = useState<QueryDraft | null>(null)
  return (
    <section className="screen live-screen">
    <LiveConnectionHeader
      connection={connection}
      livePanel={livePanel}
      onSetLivePanel={(panel) => {
        if (panel === 'query' && latestExploreDraft) {
          onSetQueryDraft(latestExploreDraft)
        }

        onSetLivePanel(panel)
      }}
      onReturnHome={onReturnHome}
    />

    {livePanel === 'query' && (
      <QueryPanel
        connection={connection}
        queries={queries}
        onSaveQuery={onSaveQuery}
        queryDraft={queryDraft}
        onSetQueryDraft={onSetQueryDraft}
      />
    )}

    {livePanel === 'explore' && (
      <ExplorePanel
        connection={connection}
        onPreviewLoaded={setLatestExploreDraft}
        onOpenInQuery={(draft) => {
          setLatestExploreDraft(draft)
          onSetQueryDraft(draft)
          onSetLivePanel('query')
        }}
      />
    )}
    </section>
  )
}

type LiveConnectionHeaderProps = {
  connection: SavedConnection
  livePanel: LivePanel
  onSetLivePanel: (panel: LivePanel) => void
  onReturnHome: () => void
}

function LiveConnectionHeader({
  connection,
  livePanel,
  onSetLivePanel,
  onReturnHome,
}: LiveConnectionHeaderProps): React.JSX.Element {
  return (
    <header className="live-header">
      <div className="live-header-left">
        <img
          src={liveCanaryLogo}
          className="live-canary"
          alt="Live Canary DB connection"
        />

        <div>
          <p className="eyebrow">Live connection</p>
          <h1>{connection.name}</h1>
          <p className="muted">
            {connection.user}@{connection.host}
            {connection.database ? ` / ${connection.database}` : ''}
          </p>
        </div>
      </div>

      <div className="live-header-actions">
        <div className="panel-toggle">
          <button
            type="button"
            className={livePanel === 'query' ? 'active' : 'secondary'}
            onClick={() => onSetLivePanel('query')}
          >
            Query
          </button>

          <button
            type="button"
            className={livePanel === 'explore' ? 'active' : 'secondary'}
            onClick={() => onSetLivePanel('explore')}
          >
            Explore
          </button>
        </div>

        <button type="button" className="secondary" onClick={onReturnHome}>
          Home
        </button>
      </div>
    </header>
  )
}

type QueryPanelProps = {
  connection: SavedConnection
  queries: SavedQuery[]
  onSaveQuery: (query: SavedQuery) => void
  queryDraft: QueryDraft | null
  onSetQueryDraft: (draft: QueryDraft | null) => void
}

function QueryPanel({
  connection,
  queries,
  onSaveQuery,
  queryDraft,
  onSetQueryDraft,
}: QueryPanelProps): React.JSX.Element {
  const [selectedQueryId, setSelectedQueryId] = useState('')
  const [queryName, setQueryName] = useState('')
  const [querySql, setQuerySql] = useState('SELECT NOW();')

  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [filter, setFilter] = useState('')
  const [expandedCell, setExpandedCell] = useState<{
    column: string
    value: unknown
  } | null>(null)

  useEffect(() => {
    if (!queryDraft) return

    setSelectedQueryId('')
    setQueryName(queryDraft.name)
    setQuerySql(queryDraft.sql)
    setResult(queryDraft.result ?? null)
    setError('')
    setFilter('')
  }, [queryDraft])

  const filteredRows = useMemo(() => {
    if (!result) return []

    const search = filter.trim().toLowerCase()

    if (!search) {
      return result.rows
    }

    return result.rows.filter((row) =>
      Object.values(row).some((value) =>
        formatValue(value).toLowerCase().includes(search)
      )
    )
  }, [result, filter])

  function loadSelectedQuery(queryId: string): void {
    onSetQueryDraft(null)
    setSelectedQueryId(queryId)

    const selected = queries.find((query) => query.id === queryId)

    if (!selected) {
      setQueryName('')
      setQuerySql('SELECT NOW();')
      setResult(null)
      return
    }

    setQueryName(selected.name)
    setQuerySql(selected.sql)
    setResult(null)
  }

  function saveCurrentQuery(): void {
    const id = selectedQueryId || crypto.randomUUID()

    onSaveQuery({
      id,
      connectionId: connection.id,
      name: queryName,
      sql: querySql,
    })

    setSelectedQueryId(id)
    onSetQueryDraft(null)
  }

  async function runQuery(): Promise<void> {
    setIsRunning(true)
    setError('')
    setResult(null)

    try {
      const response = await window.dbApi.query({
        host: connection.host,
        port: Number(connection.port),
        user: connection.user,
        password: connection.password ?? '',
        database: connection.database,
        query: querySql,
      })

      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <section className="query-panel-layout">
      <div className="panel query-panel">
        <h2>Query</h2>

        <label>
          Load saved query
          <select
            value={selectedQueryId}
            onChange={(event) => loadSelectedQuery(event.target.value)}
          >
            <option value="">New query</option>

            {queries.map((query) => (
              <option key={query.id} value={query.id}>
                {query.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Query name
          <input
            value={queryName}
            onChange={(event) => setQueryName(event.target.value)}
            placeholder="Latest trouble tickets"
          />
        </label>

        <label className="sql-label">
          SQL
          <textarea
            value={querySql}
            onChange={(event) => setQuerySql(event.target.value)}
            spellCheck={false}
          />
        </label>

        <div className="button-row">
          <button
            type="button"
            onClick={runQuery}
            disabled={isRunning || !querySql}
          >
            {isRunning ? 'Running...' : 'Run query'}
          </button>

          <button
            type="button"
            className="secondary"
            onClick={saveCurrentQuery}
            disabled={!queryName || !querySql}
          >
            Save query
          </button>
        </div>
      </div>

      {error && (
        <div className="panel error">
          <h2>Error</h2>
          <pre>{error}</pre>
        </div>
      )}

      {result && (
        <div className="panel results-panel">
          <div className="results-header">
            <h2>Results</h2>

            <div className="results-actions">
              <input
                className="filter-input"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Filter results..."
              />

              <button
                type="button"
                className="secondary"
                onClick={() =>
                  exportRowsToCsv(
                    `${connection.name.replaceAll(' ', '-').toLowerCase()}-results.csv`,
                    result.columns,
                    filteredRows
                  )
                }
                disabled={filteredRows.length === 0}
              >
                Export CSV
              </button>
            </div>
          </div>

          <p className="muted">
            Showing {filteredRows.length} of {result.rows.length} rows
          </p>

          {result.rows.length === 0 ? (
            <p>No rows returned.</p>
          ) : (
            <>
              <ResultsTable
                columns={result.columns}
                rows={filteredRows}
                onOpenCell={(column, value) => setExpandedCell({ column, value })}
              />

              {expandedCell && (
                <CellViewerModal
                  column={expandedCell.column}
                  value={expandedCell.value}
                  onClose={() => setExpandedCell(null)}
                />
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}

type ExplorePanelProps = {
  connection: SavedConnection
  onPreviewLoaded: (draft: QueryDraft | null) => void
  onOpenInQuery: (draft: QueryDraft) => void
}

function ExplorePanel({
  connection,
  onPreviewLoaded,
  onOpenInQuery,
}: ExplorePanelProps): React.JSX.Element {
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState('')
  const [preview, setPreview] = useState<QueryResult | null>(null)
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([])
  const [error, setError] = useState('')
  const [isLoadingTables, setIsLoadingTables] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [filter, setFilter] = useState('')
  const [expandedCell, setExpandedCell] = useState<{
    column: string
    value: unknown
  } | null>(null)


  function buildTablePreviewSql(tableName: string): string {
        return `SELECT *
    FROM \`${tableName.replaceAll('`', '``')}\`
    ORDER BY id DESC
    LIMIT 10;`
  }

  useEffect(() => {
  loadTables()
  }, [])

  const filteredTables = useMemo(() => {
    const search = filter.trim().toLowerCase()

    if (!search) return tables

    return tables.filter((table) => table.toLowerCase().includes(search))
  }, [tables, filter])

  async function loadTables(): Promise<void> {
    setIsLoadingTables(true)
    setError('')
    setPreview(null)
    setTableColumns([])
    setSelectedTable('')
    onPreviewLoaded(null)

    try {
      const response = await window.dbApi.listTables({
        host: connection.host,
        port: Number(connection.port),
        user: connection.user,
        password: connection.password ?? '',
        database: connection.database,
      })

      setTables(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoadingTables(false)
    }
  }

  async function loadPreview(tableName: string): Promise<void> {
    setSelectedTable(tableName)
    setPreview(null)
    setTableColumns([])
    setError('')
    setIsLoadingPreview(true)

    try {
      const [previewResponse, columnsResponse] = await Promise.all([
        window.dbApi.getTablePreview({
          host: connection.host,
          port: Number(connection.port),
          user: connection.user,
          password: connection.password ?? '',
          database: connection.database,
          tableName,
        }),
        window.dbApi.getTableColumns({
          host: connection.host,
          port: Number(connection.port),
          user: connection.user,
          password: connection.password ?? '',
          database: connection.database,
          tableName,
        }),
      ])

      setPreview(previewResponse)
      setTableColumns(columnsResponse)

      onPreviewLoaded({
        name: `Explore ${tableName}`,
        sql: buildTablePreviewSql(tableName),
        result: previewResponse,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoadingPreview(false)
    }
  }

  return (
    <section className="explore-layout">
      <aside className="panel table-list-panel">
        <div className="explore-panel-header">
          <h2>Tables</h2>

          <button type="button" className="secondary" onClick={loadTables}>
            {isLoadingTables ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter tables..."
        />

    <div className="table-list">
      {isLoadingTables && <p className="muted">Loading tables...</p>}

      {!isLoadingTables && filteredTables.length === 0 && (
        <p className="muted">No tables found.</p>
      )}

      {!isLoadingTables &&
        filteredTables.map((table) => (
          <button
            key={table}
            type="button"
            className={selectedTable === table ? 'table-item active' : 'table-item'}
            onClick={() => loadPreview(table)}
          >
            {table}
          </button>
        ))}
    </div>
      </aside>

          <section className="panel table-preview-panel">
        <div className="results-header">
          <div>
            <h2>{selectedTable || 'Select a table'}</h2>
            <p className="muted">
              {selectedTable
                ? 'Top 100 rows ordered by id DESC'
                : isLoadingTables
                  ? 'Loading tables...'
                  : 'Choose a table from the left.'}
            </p>
          </div>

          {preview && selectedTable && (
            <div className="results-actions">
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  exportRowsToCsv(
                    `${selectedTable}-top-10.csv`,
                    preview.columns,
                    preview.rows
                  )
                }
              >
                Export CSV
              </button>

              <button
                type="button"
                onClick={() =>
                  onOpenInQuery({
                    name: `Explore ${selectedTable}`,
                    sql: buildTablePreviewSql(selectedTable),
                    result: preview,
                  })
                }
              >
                Open in Query
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            <pre>{error}</pre>
          </div>
        )}

        {isLoadingPreview && <p>Loading preview...</p>}


        {preview && preview.rows.length === 0 && <p>No rows returned.</p>}

        {preview && preview.rows.length > 0 && (
          <>
            <ResultsTable
            columns={preview.columns}
            rows={preview.rows}
            columnTypes={tableColumns}
            onOpenCell={(column, value) => setExpandedCell({ column, value })}
            />

            {expandedCell && (
              <CellViewerModal
                column={expandedCell.column}
                value={expandedCell.value}
                onClose={() => setExpandedCell(null)}
              />
            )}
          </>
        )}
      </section>
    </section>
  )
}

type ResultsTableProps = {
  columns: string[]
  rows: Record<string, unknown>[]
  columnTypes?: TableColumn[]
  onOpenCell: (column: string, value: unknown) => void
}

function ResultsTable({
  columns,
  rows,
  columnTypes = [],
  onOpenCell,
}: ResultsTableProps): React.JSX.Element {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
          {columns.map((column) => {
            const columnMeta = columnTypes.find((item) => item.name === column)

            return (
              <th key={column}>
                <span className="column-name">{column}</span>

                {columnMeta && (
                  <span className="column-type">
                    {columnMeta.columnType}
                    {columnMeta.columnKey ? ` · ${columnMeta.columnKey}` : ''}
                  </span>
                )}
              </th>
            )
          })}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => {
                const value = row[column]
                const displayValue = formatValue(value)
                const expandable = isExpandableCell(value)

                return (
                  <td
                    key={column}
                    className={expandable ? 'clickable-cell' : undefined}
                    title={expandable ? 'Click to expand' : displayValue}
                    onClick={() => {
                      if (expandable) {
                        onOpenCell(column, value)
                      }
                    }}
                  >
                    {displayValue}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type CellViewerModalProps = {
  column: string
  value: unknown
  onClose: () => void
}

function CellViewerModal({
  column,
  value,
  onClose,
}: CellViewerModalProps): React.JSX.Element {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Expanded value for ${column}`}
      >
        <div className="modal-header">
          <h2>{column}</h2>

          <button type="button" className="secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="modal-body">
          <pre>{formatExpandedValue(value)}</pre>
        </div>
      </div>
    </div>
  )
}

function exportRowsToCsv(
  filename: string,
  columns: string[],
  rows: Record<string, unknown>[]
): void {
  const header = columns.map(escapeCsvValue).join(',')

  const body = rows
    .map((row) =>
      columns.map((column) => escapeCsvValue(formatValue(row[column]))).join(',')
    )
    .join('\n')

  const csv = `${header}\n${body}`

  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

function escapeCsvValue(value: string): string {
  const shouldQuote =
    value.includes(',') ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')


  const escaped = value.replaceAll('"', '""')

  return shouldQuote ? `"${escaped}"` : escaped
}

function isExpandableCell(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'object') return true

  const text = String(value)

  if (text.length > 120) return true

  return looksLikeJson(text)
}

function looksLikeJson(value: string): boolean {
  const trimmed = value.trim()

  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  )
}

function formatExpandedValue(value: unknown): string {
  if (value === null) return 'NULL'
  if (value === undefined) return ''

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  const text = String(value)

  if (looksLikeJson(text)) {
    try {
      return JSON.stringify(JSON.parse(text), null, 2)
    } catch {
      return text
    }
  }

  return text
}

function formatValue(value: unknown): string {
  if (value === null) return 'NULL'
  if (value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default App