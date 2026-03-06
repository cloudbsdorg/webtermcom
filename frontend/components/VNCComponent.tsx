import React, { useEffect, useRef } from 'react';
import RFB from '@novnc/novnc/core/rfb';
import { getWebSocketUrl } from '../api';

interface VNCProps {
  sessionId: string;
  subId: string;
  password?: string;
}

const VNCComponent: React.FC<VNCProps> = ({ sessionId, subId, password }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const url = getWebSocketUrl(sessionId, subId).replace('ws://', 'ws://').replace('wss://', 'wss://');
    
    try {
        const rfb = new RFB(containerRef.current, url, {
            credentials: { password: password }
        });

        rfb.scaleViewport = true;
        rfb.resizeSession = true;

        rfb.addEventListener("connect", () => {
            console.log("VNC Connected");
        });

        rfb.addEventListener("disconnect", (e: any) => {
            console.log("VNC Disconnected", e.detail.clean);
        });

        rfbRef.current = rfb;
    } catch (err) {
        console.error("VNC error", err);
    }

    return () => {
      if (rfbRef.current) {
        rfbRef.current.disconnect();
      }
    };
  }, [sessionId, subId, password]);

  return <div ref={containerRef} className="w-full h-full bg-black flex items-center justify-center overflow-auto" />;
};

export default VNCComponent;
