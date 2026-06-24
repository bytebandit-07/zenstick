import { useState, useEffect, useRef } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { invoke } from '@tauri-apps/api/core';
import { emit, listen } from '@tauri-apps/api/event';
import { enable, isEnabled } from '@tauri-apps/plugin-autostart';
import { useNotes } from './hooks/useNotes';
import ZenWidget from './components/ZenWidget';
import StandaloneWidget from './components/StandaloneWidget'; 
import NotesSidebar from './components/NotesSidebar';
import DashboardView from './components/DashboardView';
import TutorialTour from './components/TutorialTour';
import { NOTE_COLORS } from './types';
import { Activity, StickyNote, Info, Cpu, Zap, Shield, ExternalLink, PanelLeftClose, PanelLeftOpen, HelpCircle } from 'lucide-react';

type View = 'editor' | 'dashboard';

export default function App() {
  const {
    notes, activeNote, activeNoteId, setActiveNoteId,
    updateNoteContent, updateNoteTitle, updateNoteColor,
    togglePin, addNote, deleteNote, restoreSnapshot, deleteSnapshot,
  } = useNotes();

  const [view, setView] = useState<View>('dashboard');
  const [showSidebar, setShowSidebar] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [windowLabel, setWindowLabel] = useState<string>('');
  const isIncomingSyncRef = useRef(false);

  //  TUTORIAL STATE MANAGEMENT
  const [runTour, setRunTour] = useState(false);
  const [tourKey, setTourKey] = useState(0); // new: to nreset the tour

  useEffect(() => {
    const checkAutostart = async () => {
      try {
        const autostartEnabled = await isEnabled();
        if (!autostartEnabled) await enable();
      } catch (err) { console.error("Autostart error:", err); }
    };
    checkAutostart();
  }, []);

  useEffect(() => {
    try {
      const appWindow = getCurrentWebviewWindow();
      const label = appWindow.label;
      setWindowLabel(label);

      if (label === 'widget') {
        document.documentElement.style.background = 'transparent';
        document.body.style.background = 'transparent';
        document.body.className = ''; 
      } else {
        document.body.className = 'wallpaper-bg';
      }
    } catch (e) {}
    return () => { document.body.className = ''; };
  }, []);

  // Non-blocking Tutorial Trigger (First time user)
  useEffect(() => {
    if (windowLabel === '' || windowLabel === 'widget') return;

    const hasSeenTutorial = localStorage.getItem('zenstick:tutorial_seen');
    if (!hasSeenTutorial) {
      const timer = setTimeout(() => {
        setView('editor');
        setShowSidebar(true);
        setRunTour(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [windowLabel]);

  useEffect(() => {
    if (windowLabel === 'widget') {
      const savedActiveId = localStorage.getItem('zenstick:active_id');
      if (savedActiveId && savedActiveId !== activeNoteId) {
        isIncomingSyncRef.current = true;
        setActiveNoteId(savedActiveId);
      }
    }
  }, [windowLabel, activeNoteId, setActiveNoteId]);

  useEffect(() => {
    let isMounted = true;
    const unlistenRegistry: (() => void)[] = [];
    const setupListeners = async () => {
      const unContent = await listen('sync_content', (event: any) => {
        if (!isMounted) return;
        if (event.payload.origin !== windowLabel) updateNoteContent(event.payload.id, event.payload.content);
      });
      if (!isMounted) unContent(); else unlistenRegistry.push(unContent);

      const unTitle = await listen('sync_title', (event: any) => {
        if (!isMounted) return;
        if (event.payload.origin !== windowLabel) updateNoteTitle(event.payload.id, event.payload.title);
      });
      if (!isMounted) unTitle(); else unlistenRegistry.push(unTitle);

      const unActiveId = await listen('sync_active_id', (event: any) => {
        if (!isMounted) return;
        if (event.payload.origin !== windowLabel) {
          isIncomingSyncRef.current = true; 
          setActiveNoteId(event.payload.id);
        }
      });
      if (!isMounted) unActiveId(); else unlistenRegistry.push(unActiveId);

      const unReqAdd = await listen('request_add_note', (event: any) => {
        if (!isMounted) return;
        if (windowLabel !== 'widget') addNote(event.payload.color); 
      });
      if (!isMounted) unReqAdd(); else unlistenRegistry.push(unReqAdd);
    };

    setupListeners();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'zenstick:active_id' && e.newValue && e.newValue !== activeNoteId) {
        isIncomingSyncRef.current = true;
        setActiveNoteId(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => { isMounted = false; unlistenRegistry.forEach(unsub => unsub()); window.removeEventListener('storage', handleStorageChange); };
  }, [setActiveNoteId, updateNoteContent, updateNoteTitle, windowLabel, activeNoteId, addNote]);

  useEffect(() => {
    if (activeNoteId) {
      localStorage.setItem('zenstick:active_id', activeNoteId);
      if (isIncomingSyncRef.current) { isIncomingSyncRef.current = false; return; }
      emit('sync_active_id', { id: activeNoteId, origin: windowLabel });
    }
  }, [activeNoteId, windowLabel]);

  useEffect(() => {
    if (windowLabel === 'widget' && !activeNoteId && notes.length > 0) setActiveNoteId(notes[0].id);
  }, [windowLabel, activeNoteId, notes, setActiveNoteId]);

  const handleAddNote = async (color: any = 'violet') => {
    const newId = await addNote(color);
    localStorage.setItem('zenstick:active_id', newId);
    emit('sync_active_id', { id: newId, origin: windowLabel });
  };

  const handleUpdateContent = (content: string) => {
    if (!activeNote) return;
    updateNoteContent(activeNote.id, content);
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1800);
    emit('sync_content', { id: activeNote.id, content, origin: windowLabel });
  };

  const handleUpdateTitle = (title: string) => {
    if (!activeNote) return;
    updateNoteTitle(activeNote.id, title);
    emit('sync_title', { id: activeNote.id, title, origin: windowLabel });
  };

  const openFloatingWidget = async () => {
    try {
      if (activeNoteId) {
        localStorage.setItem('zenstick:active_id', activeNoteId);
        emit('sync_active_id', { id: activeNoteId, origin: 'force_launch' }); 
      }
      await invoke('swap_to_widget'); 
    } catch (e) { alert("Widget launch failed: " + e); }
  };

  const handleTourEnd = () => {
    setRunTour(false);
    localStorage.setItem('zenstick:tutorial_seen', 'true');
  };

  // FIX: force reset the component for guide button
  const handleManualTourStart = () => {
    setView('editor');
    setShowSidebar(true);
    setTourKey(prev => prev + 1); 
    setTimeout(() => setRunTour(true), 300);
  };

  const colors = activeNote ? NOTE_COLORS[activeNote.color] : NOTE_COLORS.violet;

  if (windowLabel === 'widget') {
    return (
      <div className="w-screen h-screen overflow-hidden bg-transparent">
        {activeNote ? (
          <StandaloneWidget 
            note={activeNote}
            onUpdateContent={handleUpdateContent}
            onUpdateTitle={handleUpdateTitle}
            onRestoreSnapshot={snap => restoreSnapshot(activeNote.id, snap)}
            onDeleteSnapshot={id => deleteSnapshot(activeNote.id, id)}
            onTogglePin={() => togglePin(activeNote.id)}
            onDelete={() => deleteNote(activeNote.id)}
            onAddNote={() => handleAddNote('violet')}
            onShowNotes={() => invoke('swap_to_main')}
            isSaving={isSaving}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50">Loading Workspace...</div>
        )}
      </div>
    );
  }

  return (
    <div className="wallpaper-bg min-h-screen w-full overflow-hidden relative flex flex-col">
      {/* Isolated Tutorial Render Area with tourKey */}
      <TutorialTour key={tourKey} run={runTour} onTourEnd={handleTourEnd} />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl" style={{ background: colors.accent, top: '-100px', right: '-100px', animation: 'blob 8s ease-in-out infinite alternate' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-3xl" style={{ background: '#3b82f6', bottom: '-50px', left: '-80px', animation: 'blob 10s ease-in-out infinite alternate-reverse' }} />
      </div>

      <div className="flex-shrink-0 relative z-10 flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ background: colors.bg, borderColor: colors.border }}>
            <StickyNote className="w-4 h-4" style={{ color: colors.accent }} />
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight">ZenStick</span>
            <p className="text-[9px] text-white/30 uppercase tracking-widest -mt-0.5">Glassmorphic Notes</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 shadow-sm">
          <NavTab active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<Activity className="w-3.5 h-3.5" />} label="Home" />
          <NavTab active={view === 'editor'} onClick={() => setView('editor')} icon={<StickyNote className="w-3.5 h-3.5" />} label="Editor" />
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button data-tour="launch-widget" onClick={openFloatingWidget} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-white/50 hover:text-white hover:bg-white/10 active:bg-white/20 active:text-white">
            <ExternalLink className="w-3.5 h-3.5" /> Launch Floating Widget
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            data-tour="help-button"
            onClick={handleManualTourStart}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs font-medium text-white/50 hover:text-white hover:bg-white/10 transition-all"
            title="Start App Tour"
          >
            <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
            <span>Guide</span>
          </button>
          <StatBadge icon={<Zap className="w-3 h-3 text-amber-400" />} label="Native Performance" />
          <StatBadge icon={<Shield className="w-3 h-3 text-emerald-400" />} label="Local Storage" />
          <StatBadge icon={<Cpu className="w-3 h-3 text-blue-400" />} label="Tauri v2" />
        </div>
      </div>

      <div className="flex-1 relative z-10 overflow-hidden pb-4">
        {view === 'dashboard' ? (
          <div className="mx-auto max-w-4xl px-4 h-full">
            <div className="rounded-3xl border overflow-hidden h-full" style={{ background: 'rgba(15,12,41,0.82)', backdropFilter: 'blur(24px)', borderColor: 'rgba(255,255,255,0.10)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
              <DashboardView 
                notes={notes}
                onSelectNote={(id) => { setActiveNoteId(id); setView('editor'); }}
                onCreateNote={() => { handleAddNote('violet'); setView('editor'); }}
                onViewAllNotes={() => { setView('editor'); setShowSidebar(true); }}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full px-6 gap-6">
            
            <div 
              data-tour="sidebar"
              className={`transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden ${
                showSidebar ? 'w-[260px] opacity-100' : 'w-0 opacity-0'
              }`}
            >
              <div className="w-[260px] h-full rounded-2xl border flex flex-col" style={{ background: 'rgba(15,12,41,0.85)', backdropFilter: 'blur(24px)', borderColor: 'rgba(255,255,255,0.10)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)', padding: '16px' }}>
                <NotesSidebar 
                  notes={notes} 
                  activeNoteId={activeNoteId} 
                  onSelectNote={id => setActiveNoteId(id)} 
                  onAddNote={(color) => handleAddNote(color)} 
                  onDeleteNote={deleteNote} 
                  onTogglePin={togglePin} 
                  onClose={() => setShowSidebar(false)} 
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full">
              
              <div className="flex-shrink-0 pb-3 flex items-center gap-3">
                <button 
                  data-tour="sidebar-toggle"
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-black/20 hover:bg-white/10 text-white/60 hover:text-white transition-all shadow-sm"
                  title={showSidebar ? "Close Sidebar" : "Open Sidebar"}
                >
                  {showSidebar ? <PanelLeftClose className="w-4.5 h-4.5" /> : <PanelLeftOpen className="w-4.5 h-4.5" />}
                </button>
                <span className="text-xs font-semibold text-white/30 uppercase tracking-widest">
                  {activeNote ? 'Active Workspace' : 'Editor'}
                </span>
              </div>

              <div className="flex-1 min-h-0 w-full flex justify-center">
                <div data-tour="editor-area" className="w-full max-w-4xl h-[80vh] flex flex-col transition-all duration-300">
                  {activeNote ? (
                    <ZenWidget
                      key={activeNote.id}
                      note={activeNote}
                      onUpdateContent={handleUpdateContent}
                      onUpdateTitle={handleUpdateTitle}
                      onRestoreSnapshot={snap => restoreSnapshot(activeNote.id, snap)}
                      onDeleteSnapshot={id => deleteSnapshot(activeNote.id, id)}
                      onTogglePin={() => togglePin(activeNote.id)}
                      onDelete={() => deleteNote(activeNote.id)}
                      onAddNote={() => handleAddNote('violet')}
                      onShowNotes={() => setShowSidebar(!showSidebar)}
                      isSaving={isSaving}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full rounded-2xl border bg-black/20 backdrop-blur-md border-white/10 shadow-2xl">
                      <p className="text-white/40 text-sm">No notes available.</p>
                      <button onClick={() => handleAddNote('violet')} className="mt-4 px-4 py-2 bg-violet-500/20 text-violet-300 rounded-lg text-xs hover:bg-violet-500/30 transition-all">
                        Create First Note
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="w-[220px] flex-shrink-0 h-full overflow-y-auto custom-scrollbar flex flex-col gap-4 pr-2">
              {activeNote && (
                <div className="rounded-2xl border p-4" style={{ background: 'rgba(15, 12, 41, 0.70)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <p className="text-[9px] font-semibold text-white/30 uppercase tracking-widest mb-3">Note Color</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(NOTE_COLORS) as [keyof typeof NOTE_COLORS, typeof NOTE_COLORS[keyof typeof NOTE_COLORS]][]).map(([key, val]) => (
                      <button key={key} onClick={() => updateNoteColor(activeNote.id, key)} title={val.label} className={['w-10 h-10 rounded-xl border-2 transition-all hover:scale-105', activeNote.color === key ? 'scale-105 ring-2 ring-offset-1 ring-offset-transparent' : ''].join(' ')} style={{ background: val.bg, borderColor: val.accent }} />
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border p-4" style={{ background: 'rgba(15, 12, 41, 0.70)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <Info className="w-3 h-3 text-white/30" />
                  <p className="text-[9px] font-semibold text-white/30 uppercase tracking-widest">Shortcuts</p>
                </div>
                <div className="space-y-2">
                   <ShortcutRow keyStr="Ctrl+B" label="Bold" />
                   <ShortcutRow keyStr="Ctrl+I" label="Italic" />
                   <ShortcutRow keyStr="# Space" label="H1" />
                </div>
              </div>

              {activeNote && (
                <div className="rounded-2xl border p-4" style={{ background: 'rgba(15, 12, 41, 0.70)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <p className="text-[9px] font-semibold text-white/30 uppercase tracking-widest mb-3">Note Stats</p>
                  <div className="space-y-2">
                    <StatRow label="Notes" value={notes.length} />
                    <StatRow label="Snapshots" value={activeNote.snapshots.length} color={colors.accent} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blob {
          from { transform: scale(1) translate(0, 0); }
          to   { transform: scale(1.15) translate(30px, -20px); }
        }
      `}</style>

      <div className="absolute bottom-4 right-6 pointer-events-none z-0">
        <p className="text-[10px] font-medium text-white/20 tracking-widest uppercase">
          Crafted by <span className="text-white/40 font-bold">Talal</span>
        </p>
      </div>

    </div>
  );
}

function ShortcutRow({ keyStr, label }: { keyStr: string, label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-mono bg-white/8 text-white/50 px-1.5 py-0.5 rounded">{keyStr}</span>
      <span className="text-[9px] text-white/35">{label}</span>
    </div>
  );
}

function NavTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
        active ? 'bg-white/15 text-white shadow-sm' : 'text-white/40 hover:text-white/70 hover:bg-white/8',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  );
}

function StatBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="hidden lg:flex items-center gap-1.5 text-xs text-white/35">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-white/35">{label}</span>
      <span className="text-[10px] font-semibold" style={{ color: color || 'rgba(255,255,255,0.6)' }}>
        {value}
      </span>
    </div>
  );
}