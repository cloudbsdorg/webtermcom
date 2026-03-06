import React, { Suspense, lazy } from 'react';
import { Session, SubSession } from '../types';
import { useTranslation } from 'react-i18next';

const TerminalComponent = lazy(() => import('./TerminalComponent'));
const VNCComponent = lazy(() => import('./VNCComponent'));
const SerialComponent = lazy(() => import('./SerialComponent'));

interface ViewportProps {
  session: Session;
  subSession: SubSession;
}

const Viewport: React.FC<ViewportProps> = ({ session, subSession }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full">
      <Suspense fallback={<div className="flex items-center justify-center h-full text-zinc-500">{t('common.loading')}</div>}>
        {subSession.params.type === 'ssh' && (
          <TerminalComponent sessionId={session.id} subId={subSession.id} />
        )}
        {subSession.params.type === 'telnet' && (
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
      </Suspense>
    </div>
  );
};

export default Viewport;
