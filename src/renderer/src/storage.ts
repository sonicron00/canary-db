import type { SavedConnection, SavedQuery } from './types'

const CONNECTIONS_KEY = 'canary-db.connections'
const QUERIES_KEY = 'canary-db.queries'

export function loadConnections(): SavedConnection[] {
  const raw = localStorage.getItem(CONNECTIONS_KEY)
  return raw ? JSON.parse(raw) : []
}

export function saveConnections(connections: SavedConnection[]): void {
  localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections))
}

export function loadQueries(): SavedQuery[] {
  const raw = localStorage.getItem(QUERIES_KEY)
  return raw ? JSON.parse(raw) : []
}

export function saveQueries(queries: SavedQuery[]): void {
  localStorage.setItem(QUERIES_KEY, JSON.stringify(queries))
}