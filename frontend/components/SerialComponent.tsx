import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { ConnectionParams } from '../types';

interface SerialProps {
  params: ConnectionParams;
}

const SerialComponent: React.FC<SerialProps> = ({ params }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availablePorts, setAvailablePorts] = useState<any[]>([]);
  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const termRef = useRef<Terminal | null>(null);

  useEffect(() => {
    // Check for already authorized ports
    if ("serial" in navigator) {
      (navigator as any).serial.getPorts().then((ports: any[]) => {
        setAvailablePorts(ports);
      });
    }

    if (!terminalRef.current) return;
    const term = new Terminal({ cursorBlink: true });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    termRef.current = term;

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  const connectSerial = async (existingPort?: any) => {
    try {
      if (!("serial" in navigator)) {
        throw new Error("Web Serial API not supported");
      }
      
      const port = existingPort || await (navigator as any).serial.requestPort();
      await port.open({ 
        baudRate: params.baudRate || 115200,
        dataBits: params.dataBits || 8,
        stopBits: params.stopBits || 1,
        parity: params.parity || 'none'
      });
      
      portRef.current = port;
      setConnected(true);
      setError(null);

      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;

      const textEncoder = new TextEncoderStream();
      const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
      const writer = textEncoder.writable.getWriter();

      termRef.current?.onData((data: string) => {
        writer.write(data);
      });

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        termRef.current?.write(value);
      }
    } catch (err: any) {
      setError(err.message);
      setConnected(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {!connected && (
        <div className="p-8 flex flex-col items-center justify-center gap-6 bg-zinc-900 flex-1">
           <div className="text-center space-y-2">
             <h2 className="text-xl font-bold">Serial Connection</h2>
             <p className="text-sm text-zinc-400">
               Settings: {params.baudRate} bps, {params.dataBits}N{params.stopBits} ({params.parity})
             </p>
           </div>

           <div className="flex flex-col gap-3 w-full max-w-xs">
             <button 
               onClick={() => connectSerial()}
               className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded font-bold shadow-lg transition-all"
             >
               Request New Port
             </button>

             {availablePorts.length > 0 && (
               <div className="space-y-2 mt-4">
                 <p className="text-xs text-zinc-500 uppercase font-semibold">Previously Used Ports</p>
                 {availablePorts.map((p, i) => (
                   <button
                     key={i}
                     onClick={() => connectSerial(p)}
                     className="w-full bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded text-sm text-left border border-zinc-700"
                   >
                     Port {i + 1} (VID: {p.getInfo().usbVendorId || '?'})
                   </button>
                 ))}
               </div>
             )}
           </div>

           {error && <div className="text-red-400 text-sm bg-red-900/20 px-4 py-2 rounded border border-red-900/50">{error}</div>}
           
           <p className="text-xs text-zinc-500 max-w-sm text-center">
             Web Serial API allows direct communication with local hardware. 
             Connections are private to your browser session.
           </p>
        </div>
      )}
      <div ref={terminalRef} className={`flex-1 bg-black ${!connected ? 'hidden' : ''}`} />
    </div>
  );
};

export default SerialComponent;
