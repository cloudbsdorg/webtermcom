import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { getWebSocketUrl } from '../api';

interface TerminalProps {
  sessionId: string;
  subId: string;
}

const TerminalComponent: React.FC<TerminalProps> = ({ sessionId, subId }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#000000',
      }
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    xtermRef.current = term;

    const ws = new WebSocket(getWebSocketUrl(sessionId, subId));
    socketRef.current = ws;

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    term.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    const handleResize = () => {
        fitAddon.fit();
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(`__RESIZE__:${term.rows}:${term.cols}`);
        }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ws.close();
      term.dispose();
    };
  }, [sessionId, subId]);

  return <div ref={terminalRef} className="w-full h-full" />;
};

export default TerminalComponent;
