/**
 * API client for interacting with the WebTermCom backend.
 */
import { Session, SubSession, ConnectionParams } from './types';

const API_BASE = window.location.protocol + '//' + window.location.hostname + ':8000';

/**
 * Creates a new session on the backend.
 * @param name The name of the session.
 */
export async function createSession(name: string): Promise<{ id: string, session: Session }> {
  const resp = await fetch(`${API_BASE}/sessions?name=${encodeURIComponent(name)}`, {
    method: 'POST'
  });
  if (!resp.ok) throw new Error("Failed to create session");
  return resp.json();
}

/**
 * Retrieves session information from the backend.
 * @param id The session ID.
 */
export async function getSessionInfo(id: string): Promise<Session> {
  const resp = await fetch(`${API_BASE}/sessions/${id}`);
  if (!resp.ok) throw new Error("Session not found");
  return resp.json();
}

/**
 * Adds a new connection (sub-session) to an existing session.
 * @param sessionId The parent session ID.
 * @param params Connection parameters.
 */
export async function addSubSession(sessionId: string, params: ConnectionParams): Promise<SubSession> {
  const resp = await fetch(`${API_BASE}/sessions/${sessionId}/subsessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!resp.ok) throw new Error("Failed to add sub-session");
  return resp.json();
}

/**
 * Deletes a sub-session from the backend.
 * @param sessionId The parent session ID.
 * @param subId The sub-session ID.
 */
export async function deleteSubSession(sessionId: string, subId: string): Promise<void> {
  const resp = await fetch(`${API_BASE}/sessions/${sessionId}/subsessions/${subId}`, {
    method: 'DELETE'
  });
  if (!resp.ok) throw new Error("Failed to delete sub-session");
}

/**
 * Deletes a whole session from the backend.
 * @param sessionId The session ID.
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const resp = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: 'DELETE'
  });
  if (!resp.ok) throw new Error("Failed to delete session");
}

/**
 * Constructs the WebSocket URL for a given sub-session.
 */
export function getWebSocketUrl(sessionId: string, subId: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.hostname}:8000/ws/${sessionId}/${subId}`;
}
