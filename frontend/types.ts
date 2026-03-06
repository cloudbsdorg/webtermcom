export interface ConnectionParams {
  type: 'ssh' | 'vnc' | 'serial';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  device?: string;
  baudRate?: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
}

export interface SubSession {
  id: string;
  params: ConnectionParams;
  active: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  name: string;
  sub_sessions: Record<string, SubSession>;
  created_at: string;
  last_active: string;
}
