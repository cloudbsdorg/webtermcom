import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Viewport from './components/Viewport';
import { Session, SubSession } from './types';
import { createSession, getSessionInfo, addSubSession, deleteSubSession } from './api';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const [activeSubSessionId, setActiveSubSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Update document direction and language for RTL support and A11y
  useEffect(() => {
    document.documentElement.dir = i18n.dir();
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Sync session with URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('s');
    const subSessionId = urlParams.get('sub');

    if (sessionId) {
      loadSession(sessionId, subSessionId);
    } else {
      createNewSession();
    }
  }, []);

  const loadSession = async (id: string, subId: string | null) => {
    try {
      const data = await getSessionInfo(id);
      setSession(data);
      if (subId && data.sub_sessions[subId]) {
        setActiveSubSessionId(subId);
      } else if (Object.keys(data.sub_sessions).length > 0) {
        setActiveSubSessionId(Object.keys(data.sub_sessions)[0]);
      }
    } catch (err) {
      console.error("Failed to load session", err);
      createNewSession();
    }
  };

  const createNewSession = async () => {
    try {
      const { id, session: newSession } = await createSession(t('common.my_session'));
      setSession(newSession);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('s', id);
      window.history.pushState({}, '', newUrl);
    } catch (err) {
      console.error("Failed to create session", err);
    }
  };

  const handleAddSubSession = async (params: any) => {
    if (!session) return;
    try {
      const sub = await addSubSession(session.id, params);
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sub_sessions: { ...prev.sub_sessions, [sub.id]: sub }
        };
      });
      setActiveSubSessionId(sub.id);
      
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('sub', sub.id);
      window.history.pushState({}, '', newUrl);
    } catch (err) {
      console.error("Failed to add sub-session", err);
    }
  };

  const selectSubSession = (id: string) => {
    setActiveSubSessionId(id);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('sub', id);
    window.history.pushState({}, '', newUrl);
  };

  const handleDeleteSubSession = async (subId: string) => {
    if (!session) return;
    try {
      await deleteSubSession(session.id, subId);
      setSession(prev => {
        if (!prev) return prev;
        const newSubs = { ...prev.sub_sessions };
        delete newSubs[subId];
        return { ...prev, sub_sessions: newSubs };
      });
      if (activeSubSessionId === subId) {
        const remaining = Object.keys(session.sub_sessions).filter(id => id !== subId);
        if (remaining.length > 0) {
          selectSubSession(remaining[0]);
        } else {
          setActiveSubSessionId(null);
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('sub');
          window.history.pushState({}, '', newUrl);
        }
      }
    } catch (err) {
      console.error("Failed to delete sub-session", err);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-900 text-zinc-100 font-sans">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        session={session}
        activeSubId={activeSubSessionId}
        onSelect={selectSubSession}
        onAdd={handleAddSubSession}
        onDelete={handleDeleteSubSession}
      />
      <main className="flex-1 relative flex flex-col min-w-0" role="main">
        <header className="h-12 border-b border-zinc-800 flex items-center px-4 justify-between shrink-0">
           <button 
             onClick={() => setSidebarOpen(!sidebarOpen)}
             className="p-1 hover:bg-zinc-800 rounded text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
             aria-label={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
           >
             {sidebarOpen ? (
               i18n.dir() === 'rtl' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />
             ) : (
               i18n.dir() === 'rtl' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />
             )}
           </button>
           <div className="text-sm font-medium">
             {session?.name} {activeSubSessionId ? ` / ${session?.sub_sessions[activeSubSessionId]?.params.type.toUpperCase()}` : ''}
           </div>
           <div className="flex gap-2">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert(t('common.url_copied'));
                }}
                className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-white"
                aria-label={t('common.share')}
              >
                {t('common.share')}
              </button>
           </div>
        </header>
        <div className="flex-1 relative bg-black">
          {session && activeSubSessionId ? (
            <Viewport 
              session={session} 
              subSession={session.sub_sessions[activeSubSessionId]} 
            />
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-500">
              {t('common.select_session')}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
