import { useMemo, useState } from 'react';
import './App.css';

import type { QueryResult, SavedConnection, SavedQuery } from '../src/renderer/src/types';
import {
  loadConnections,
  loadQueries,
  saveConnections,
  saveQueries
} from '../src/renderer/src/storage';

type Screen = 'connections' | 'query'

function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('connections')

  const [connections, setConnections] = useState<SavedConnection[]>(() =>
    loadConnections()
  )

  const [queries, setQueries] = useState<SavedQuery[]>(() => loadQueries())

  const [activeConnection, setActiveConnection] =
    useState<SavedConnection | null>(null)

  function handleSaveConnection(connection: SavedConnection): void {
    const exists = connections.some((item) => item.id === connection.id)

    const nextConnections = exists
      ? connections.map((item) =>
          item.id === connection.id ? connection : item
        )
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
    setScreen('query')
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
      <AppHeader />

      {screen === 'connections' && (
        <ConnectionScreen
          connections={connections}
          onSaveConnection={handleSaveConnection}
          onDeleteConnection={handleDeleteConnection}
          onChooseConnection={handleChooseConnection}
        />
      )}

      {screen === 'query' && activeConnection && (
        <QueryScreen
          connection={activeConnection}
          queries={queries.filter(
            (query) => query.connectionId === activeConnection.id
          )}
          onBack={() => setScreen('connections')}
          onSaveQuery={handleSaveQuery}
        />
      )}
    </main>
  )
}

function AppHeader(): React.JSX.Element {
  return (
    <header className="app-header">
      <img src="/image.png" className="app-logo" alt="Canary DB logo" />

      <div>
        <h1>Canary DB</h1>
        <p>Fuss-free MySQL client for repeat connections and queries</p>
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
  onChooseConnection
}: ConnectionScreenProps): React.JSX.Element {
  const [selectedConnectionId, setSelectedConnectionId] = useState(
    connections[0]?.id ?? ''
  )

  const selectedConnection = connections.find(
    (connection) => connection.id === selectedConnectionId
  )

  const [name, setName] = useState('')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('3306')
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [database, setDatabase] = useState('')

  function loadSelectedIntoForm(): void {
    if (!selectedConnection) return

    setName(selectedConnection.name)
    setHost(selectedConnection.host)
    setPort(selectedConnection.port)
    setUser(selectedConnection.user)
    setPassword(selectedConnection.password ?? '')
    setDatabase(selectedConnection.database)
  }

  function clearForm(): void {
    setName('')
    setHost('')
    setPort('3306')
    setUser('')
    setPassword('')
    setDatabase('')
  }

  function saveConnection(): void {
    const id = selectedConnection?.id && name === selectedConnection.name
      ? selectedConnection.id
      : crypto.randomUUID()

    const connection: SavedConnection = {
      id,
      name,
      host,
      port,
      user,
      password,
      database
    }

    onSaveConnection(connection)
    setSelectedConnectionId(connection.id)
  }

  return (
    <section className="screen">
      <div className="panel">
        <h2>Open connection</h2>

        {connections.length === 0 ? (
          <p>No saved connections yet.</p>
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
        <h2>Create / edit connection</h2>

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

type QueryScreenProps = {
  connection: SavedConnection
  queries: SavedQuery[]
  onBack: () => void
  onSaveQuery: (query: SavedQuery) => void
}

function QueryScreen({
  connection,
  queries,
  onBack,
  onSaveQuery
}: QueryScreenProps): React.JSX.Element {
  const [selectedQueryId, setSelectedQueryId] = useState('')
  const [queryName, setQueryName] = useState('')
  const [querySql, setQuerySql] = useState('SELECT NOW();')

  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [filter, setFilter] = useState('')

  const filteredRows = useMemo(() => {
    if (!result) return []

    const search = filter.trim().toLowerCase()

    if (!search) {
      return result.rows
    }

    return result.rows.filter((row: any) =>
      Object.values(row).some((value) =>
        formatValue(value).toLowerCase().includes(search)
      )
    )
  }, [result, filter])

  function loadSelectedQuery(queryId: string): void {
    setSelectedQueryId(queryId)

    const selected = queries.find((query) => query.id === queryId)

    if (!selected) return

    setQueryName(selected.name)
    setQuerySql(selected.sql)
  }

  function saveCurrentQuery(): void {
    const id = selectedQueryId || crypto.randomUUID()

    onSaveQuery({
      id,
      connectionId: connection.id,
      name: queryName,
      sql: querySql
    })

    setSelectedQueryId(id)
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
        query: querySql
      })

      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <section className="screen">
      <div className="query-header">
        <div>
          <h2>{connection.name}</h2>
          <p>
            {connection.user}@{connection.host}
            {connection.database ? ` / ${connection.database}` : ''}
          </p>
        </div>

        <button type="button" className="secondary" onClick={onBack}>
          Change connection
        </button>
      </div>

      <div className="panel">
        <h2>Saved queries</h2>

        <label>
          Load query
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

        <label>
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
        <div className="panel">
          <div className="results-header">
            <h2>Results</h2>

            <input
              className="filter-input"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter results..."
            />
          </div>

          <p className="muted">
            Showing {filteredRows.length} of {result.rows.length} rows
          </p>

          {result.rows.length === 0 ? (
            <p>No rows returned.</p>
          ) : (
            <ResultsTable columns={result.columns} rows={filteredRows} />
          )}
        </div>
      )}
    </section>
  )
}

type ResultsTableProps = {
  columns: string[]
  rows: Record<string, unknown>[]
}

function ResultsTable({ columns, rows }: ResultsTableProps): React.JSX.Element {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column}>{formatValue(row[column])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatValue(value: unknown): string {
  if (value === null) return 'NULL'
  if (value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default App