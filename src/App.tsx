import { useState, useEffect, useRef } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { invoke } from '@tauri-apps/api/core';
import { emit, listen } from '@tauri-apps/api/event';
import { useNotes } from './hooks/useNotes';
import ZenWidget from './components/ZenWidget';
import NotesSidebar from './components/NotesSidebar';
import SetupGuide from './components/SetupGuide';
import { NOTE_COLORS } from './types';
import { BookOpen, StickyNote, Info, Cpu, Zap, Shield, ExternalLink } from 'lucide-react';

type View = 'widget' | 'setup';

export default function App() {
  const {
    notes,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    updateNoteContent,
    updateNoteTitle,
    updateNoteColor,
    togglePin,
    addNote,
    deleteNote,
    restoreSnapshot,
    deleteSnapshot,
  } = useNotes();

  const [view, setView] = useState<View>('widget');
  const [showSidebar, setShowSidebar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [windowLabel, setWindowLabel] = useState<string>('');

  const isIncomingSyncRef = useRef(false);

  // 1. WINDOW DETECTION & INITIAL SYNC
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

      if (label === 'widget') {
        const savedActiveId = localStorage.getItem('zenstick:active_id');
        if (savedActiveId && savedActiveId !== activeNoteId) {
          isIncomingSyncRef.current = true;
          setActiveNoteId(savedActiveId);
        }
      }
    } catch (e) {
      console.error("Not running in Tauri environment", e);
    }

    return () => { document.body.className = ''; };
  }, [activeNoteId, setActiveNoteId]);

  // 2. TAURI NATIVE LISTENERS
  useEffect(() => {
    let isMounted = true;
    const unlistenRegistry: (() => void)[] = [];

    const setupListeners = async () => {
      const unContent = await listen('sync_content', (event: any) => {
        if (!isMounted) return;
        if (event.payload.origin !== windowLabel) {
          updateNoteContent(event.payload.id, event.payload.content);
        }
      });
      if (!isMounted) unContent(); else unlistenRegistry.push(unContent);

      const unTitle = await listen('sync_title', (event: any) => {
        if (!isMounted) return;
        if (event.payload.origin !== windowLabel) {
          updateNoteTitle(event.payload.id, event.payload.title);
        }
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
        if (windowLabel !== 'widget') {
          addNote(event.payload.color); 
        }
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

    return () => {
      isMounted = false;
      unlistenRegistry.forEach(unsub => unsub());
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [setActiveNoteId, updateNoteContent, updateNoteTitle, windowLabel, activeNoteId, addNote]);

  // 2.5 SAFE BROADCAST ACTIVE ID CHANGES
  useEffect(() => {
    if (activeNoteId) {
      localStorage.setItem('zenstick:active_id', activeNoteId);
      if (isIncomingSyncRef.current) {
        isIncomingSyncRef.current = false;
        return;
      }
      emit('sync_active_id', { id: activeNoteId, origin: windowLabel });
    }
  }, [activeNoteId, windowLabel]);

  // 3. FALLBACK MECHANISM
  useEffect(() => {
    if (windowLabel === 'widget' && !activeNoteId && notes.length > 0) {
      setActiveNoteId(notes[0].id);
    }
  }, [windowLabel, activeNoteId, notes, setActiveNoteId]);

  const handleAddNote = (color: any = 'violet') => {
    if (windowLabel === 'widget') {
      emit('request_add_note', { color });
    } else {
      addNote(color);
    }
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
      }
      await invoke('swap_to_widget'); 
    } catch (e) {
      alert("Widget launch failed: " + e);
    }
  };

  const colors = activeNote ? NOTE_COLORS[activeNote.color] : NOTE_COLORS.violet;

  // ==========================================
  // RENDER 1: WIDGET WINDOW MODE
  // ==========================================
  if (windowLabel === 'widget') {
    if (!activeNote) {
      return (
        <div className="w-screen h-screen bg-gray-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white/50 text-xs rounded-2xl border border-white/10">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin mb-3"></div>
          Initialising ZenWidget...
        </div>
      );
    }
    
    return (
      <div className="w-screen h-screen overflow-hidden bg-transparent">
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
          onShowNotes={() => invoke('swap_to_main')}
          isSaving={isSaving}
        />
      </div>
    );
  }

  // ==========================================
  // RENDER 2: DASHBOARD FULL MODE
  // ==========================================
  return (
    <div className="wallpaper-bg min-h-screen w-full overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl" style={{ background: colors.accent, top: '-100px', right: '-100px', animation: 'blob 8s ease-in-out infinite alternate' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-3xl" style={{ background: '#3b82f6', bottom: '-50px', left: '-80px', animation: 'blob 10s ease-in-out infinite alternate-reverse' }} />
      </div>

      {/* ===== TOP NAV BAR ===== */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-3">
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
          <NavTab active={view === 'widget'} onClick={() => setView('widget')} icon={<StickyNote className="w-3.5 h-3.5" />} label="Dashboard" />
          <NavTab active={view === 'setup'} onClick={() => setView('setup')} icon={<BookOpen className="w-3.5 h-3.5" />} label="Setup Guide" />
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button onClick={openFloatingWidget} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-white/50 hover:text-white hover:bg-white/10 active:bg-white/20 active:text-white">
            <ExternalLink className="w-3.5 h-3.5" /> Launch Floating Widget
          </button>
        </div>

        <div className="flex items-center gap-4">
          <StatBadge icon={<Zap className="w-3 h-3 text-amber-400" />} label="Native Performance" />
          <StatBadge icon={<Shield className="w-3 h-3 text-emerald-400" />} label="Local Storage" />
          <StatBadge icon={<Cpu className="w-3 h-3 text-blue-400" />} label="Tauri v2" />
        </div>
      </div>

      <div className="relative z-10">
        {view === 'setup' ? (
          <div className="mx-auto max-w-2xl px-4 py-4">
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(15,12,41,0.82)', backdropFilter: 'blur(24px)', borderColor: 'rgba(255,255,255,0.10)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)', height: 'calc(100vh - 120px)' }}>
              <SetupGuide />
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-center gap-6 pt-4 px-6">
            {showSidebar && (
              <div className="rounded-2xl border overflow-hidden flex-shrink-0" style={{ background: 'rgba(15,12,41,0.85)', backdropFilter: 'blur(24px)', borderColor: 'rgba(255,255,255,0.10)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)', width: '240px', height: '500px', padding: '16px' }}>
                <NotesSidebar notes={notes} activeNoteId={activeNoteId} onSelectNote={id => { setActiveNoteId(id); setShowSidebar(false); }} onAddNote={(color) => { handleAddNote(color); setShowSidebar(false); }} onDeleteNote={deleteNote} onTogglePin={togglePin} onClose={() => setShowSidebar(false)} />
              </div>
            )}

            {activeNote && (
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
            )}

            <div className="flex flex-col gap-4 flex-shrink-0 w-[200px]">
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

      {/* 🌟 WATERMARK / SIGNATURE */}
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