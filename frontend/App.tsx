import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Viewport from './components/Viewport';
import { Session, SubSession } from './types';
import { createSession, getSessionInfo, addSubSession } from './api';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [activeSubSessionId, setActiveSubSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      const { id, session: newSession } = await createSession("My Session");
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-900 text-zinc-100 font-sans">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        session={session}
        activeSubId={activeSubSessionId}
        onSelect={selectSubSession}
        onAdd={handleAddSubSession}
      />
      <main className="flex-1 relative flex flex-col min-w-0">
        <header className="h-12 border-b border-zinc-800 flex items-center px-4 justify-between shrink-0">
           <button 
             onClick={() => setSidebarOpen(!sidebarOpen)}
             className="p-1 hover:bg-zinc-800 rounded text-zinc-400"
           >
             {sidebarOpen ? '←' : '→'}
           </button>
           <div className="text-sm font-medium">
             {session?.name} {activeSubSessionId ? ` / ${session?.sub_sessions[activeSubSessionId]?.params.type.toUpperCase()}` : ''}
           </div>
           <div className="flex gap-2">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("URL Copied!");
                }}
                className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
              >
                Share
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
              Select or create a session to start
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
