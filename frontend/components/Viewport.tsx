import React from 'react';
import { Session, SubSession } from '../types';
import TerminalComponent from './TerminalComponent';
import VNCComponent from './VNCComponent';
import SerialComponent from './SerialComponent';

interface ViewportProps {
  session: Session;
  subSession: SubSession;
}

const Viewport: React.FC<ViewportProps> = ({ session, subSession }) => {
  return (
    <div className="w-full h-full">
      {subSession.params.type === 'ssh' && (
        <TerminalComponent sessionId={session.id} subId={subSession.id} />
      )}
      {subSession.params.type === 'vnc' && (
        <VNCComponent 
          sessionId={session.id} 
          subId={subSession.id} 
          password={subSession.params.password}
        />
      )}
      {subSession.params.type === 'serial' && (
        <SerialComponent params={subSession.params} />
      )}
    </div>
  );
};

export default Viewport;
