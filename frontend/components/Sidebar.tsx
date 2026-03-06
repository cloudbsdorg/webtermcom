import React, { useState } from 'react';
import { Session, ConnectionParams } from '../types';
import { Plus, Terminal, Tv, Cpu, Share2, X, Hash } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  session: Session | null;
  activeSubId: string | null;
  onSelect: (id: string) => void;
  onAdd: (params: ConnectionParams) => void;
  onDelete: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, session, activeSubId, onSelect, onAdd, onDelete }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<'ssh' | 'vnc' | 'serial' | 'telnet'>('ssh');
  const [formData, setFormData] = useState({ 
    host: '', 
    port: '', 
    username: '', 
    password: '',
    baudRate: '115200',
    dataBits: '8',
    stopBits: '1',
    parity: 'none'
  });

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Set default ports if not specified
    let port = formData.port ? parseInt(formData.port) : undefined;
    if (!port) {
      if (newType === 'ssh') port = 22;
      else if (newType === 'vnc') port = 5900;
      else if (newType === 'telnet') port = 23;
    }

    onAdd({
      type: newType,
      host: formData.host,
      port: port,
      username: formData.username,
      password: formData.password,
      baudRate: formData.baudRate ? parseInt(formData.baudRate) : undefined,
      dataBits: formData.dataBits ? parseInt(formData.dataBits) as any : undefined,
      stopBits: formData.stopBits ? parseInt(formData.stopBits) as any : undefined,
      parity: formData.parity as any
    });
    setShowAdd(false);
    setFormData({ 
      host: '', 
      port: '', 
      username: '', 
      password: '',
      baudRate: '115200',
      dataBits: '8',
      stopBits: '1',
      parity: 'none'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="w-64 border-r border-zinc-800 flex flex-col shrink-0">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
        <h1 className="font-bold text-lg">WebTermCom</h1>
        <button onClick={() => setIsOpen(false)} className="lg:hidden p-1">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex justify-between items-center px-2 py-4">
           <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sessions</h2>
           <button 
             onClick={() => setShowAdd(true)}
             className="p-1 hover:bg-zinc-800 rounded text-zinc-400"
           >
             <Plus size={16} />
           </button>
        </div>

        <div className="space-y-1">
          {session && Object.values(session.sub_sessions).map(sub => (
            <button
              key={sub.id}
              onClick={() => onSelect(sub.id)}
              className={`w-full group flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                activeSubId === sub.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
            >
              {sub.params.type === 'ssh' && <Terminal size={16} />}
              {sub.params.type === 'vnc' && <Tv size={16} />}
              {sub.params.type === 'serial' && <Cpu size={16} />}
              {sub.params.type === 'telnet' && <Hash size={16} />}
              <span className="truncate flex-1 text-left">
                {sub.params.host || sub.params.type.toUpperCase()}
              </span>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = new URL(window.location.origin);
                    url.searchParams.set('s', session.id);
                    url.searchParams.set('sub', sub.id);
                    navigator.clipboard.writeText(url.toString());
                    alert("Sub-session URL copied!");
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-blue-400 transition-opacity"
                  title="Share"
                >
                  <Share2 size={14} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(sub.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                  title="Delete"
                >
                  <X size={14} />
                </button>
              </div>
            </button>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Add Connection</h3>
            <div className="flex gap-2 mb-4">
              {['ssh', 'vnc', 'serial', 'telnet'].map((t) => (
                <button
                  key={t}
                  onClick={() => setNewType(t as any)}
                  className={`flex-1 py-1 rounded text-[10px] border font-bold transition-all ${
                    newType === t ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {newType !== 'serial' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold px-1">Host / IP</label>
                    <input 
                      placeholder="e.g. 192.168.1.10" 
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                      value={formData.host}
                      onChange={e => setFormData({...formData, host: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold px-1">Port (Optional)</label>
                    <input 
                      placeholder={newType === 'ssh' ? '22' : newType === 'vnc' ? '5900' : '23'} 
                      className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                      value={formData.port}
                      onChange={e => setFormData({...formData, port: e.target.value})}
                    />
                  </div>
                  {(newType === 'ssh' || newType === 'vnc') && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold px-1">Username</label>
                        <input 
                          placeholder="Username" 
                          className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                          value={formData.username}
                          onChange={e => setFormData({...formData, username: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold px-1">Password</label>
                        <input 
                          type="password"
                          placeholder="Password" 
                          className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                          value={formData.password}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase">Baud Rate</label>
                      <select 
                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm"
                        value={formData.baudRate}
                        onChange={e => setFormData({...formData, baudRate: e.target.value})}
                      >
                        {[300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600].map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase">Data Bits</label>
                      <select 
                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm"
                        value={formData.dataBits}
                        onChange={e => setFormData({...formData, dataBits: e.target.value})}
                      >
                        <option value="7">7</option>
                        <option value="8">8</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase">Stop Bits</label>
                      <select 
                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm"
                        value={formData.stopBits}
                        onChange={e => setFormData({...formData, stopBits: e.target.value})}
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase">Parity</label>
                      <select 
                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm"
                        value={formData.parity}
                        onChange={e => setFormData({...formData, parity: e.target.value})}
                      >
                        <option value="none">None</option>
                        <option value="even">Even</option>
                        <option value="odd">Odd</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 italic">Serial ports will be selected in the next step via browser dialog.</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2 rounded text-sm bg-zinc-800 hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 rounded text-sm bg-blue-600 hover:bg-blue-700"
                >
                  Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2 text-red-400">Close Connection?</h3>
            <p className="text-sm text-zinc-400 mb-6">
              This will immediately terminate the connection and remove it from the session.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded text-sm bg-zinc-800 hover:bg-zinc-700"
              >
                Keep
              </button>
              <button 
                onClick={() => {
                  onDelete(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="flex-1 py-2 rounded text-sm bg-red-600 hover:bg-red-700"
              >
                Close & Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
