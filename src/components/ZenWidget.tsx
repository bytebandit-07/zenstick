import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Clock, MoreVertical, Pin, Trash2,
  StickyNote, Minus, Plus, Maximize2
} from 'lucide-react';
import { Note, NOTE_COLORS, Snapshot } from '../types';
import EditorToolbar from './EditorToolbar';
import HistoryPanel from './HistoryPanel';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { LogicalSize } from '@tauri-apps/api/dpi';

interface ZenWidgetProps {
  note: Note;
  onUpdateContent: (content: string) => void;
  onUpdateTitle: (title: string) => void;
  onRestoreSnapshot: (snapshot: Snapshot) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onShowNotes: () => void;
  onAddNote: () => void;
  isSaving: boolean;
}

type Panel = 'none' | 'history' | 'menu';

export default function ZenWidget({
  note, onUpdateContent, onUpdateTitle, onRestoreSnapshot, onDeleteSnapshot,
  onTogglePin, onDelete, onShowNotes, onAddNote, isSaving,
}: ZenWidgetProps) {
  const [panel, setPanel] = useState<Panel>('none');
  const [isMinimized, setIsMinimized] = useState(false);
  const [titleValue, setTitleValue] = useState(note.title);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  
  const [isWidgetMode, setIsWidgetMode] = useState(false);
  const isDashboard = !isWidgetMode;
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const colors = NOTE_COLORS[note.color];
  const isReady = useRef(false);

  useEffect(() => { setTitleValue(note.title); }, [note.id, note.title]);
  
  useEffect(() => {
    isReady.current = true;
    try { setIsWidgetMode(getCurrentWebviewWindow().label === 'widget'); } catch(e) {}
    return () => { isReady.current = false; };
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TaskList, TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Start typing your thoughts… ✨' }),
    ],
    content: note.currentContent,
    onUpdate: ({ editor }) => {
      if (!isReady.current) return; 
      const newHtml = editor.getHTML();
      if (newHtml === note.currentContent || (newHtml === '<p></p>' && note.currentContent === '')) return;
      onUpdateContent(newHtml);
    },
    onFocus: () => setToolbarVisible(true),
    onBlur: () => setTimeout(() => setToolbarVisible(false), 150),
    editorProps: { attributes: { class: 'tiptap-editor', spellcheck: 'true' } },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed || editor.isFocused) return;
    const incoming = note.currentContent || '';
    const current = editor.getHTML();
    if (incoming !== current) {
      queueMicrotask(() => {
        if (!editor.isDestroyed && note.currentContent === incoming) {
          editor.commands.setContent(incoming, { emitUpdate: false });
        }
      });
    }
  }, [note.id, note.currentContent, editor]);

  const handleRestoreSnapshot = useCallback((snapshot: Snapshot) => {
    onRestoreSnapshot(snapshot);
    editor?.commands.setContent(snapshot.content, { emitUpdate: false });
    setPanel('none');
  }, [editor, onRestoreSnapshot]);

  const toggleMinimize = async (minimize: boolean) => {
    setIsMinimized(minimize);
    try {
      const appWindow = getCurrentWebviewWindow();
      if (appWindow.label === 'widget') {
        if (minimize) {
          await appWindow.setSize(new LogicalSize(350, 60)); // Shrink window to just fit the capsule
        } else {
          await appWindow.setSize(new LogicalSize(350, 500)); // Back to normal size
        }
      }
    } catch (e) { console.error("Resize error:", e); }
  };

  const wordCount = editor ? editor.getText().trim().split(/\s+/).filter(Boolean).length : 0;
  
  const containerClass = "w-full h-full flex flex-col";

  // THE NEW MINIMIZED CAPSULE 
  if (isMinimized && isWidgetMode) {
    return (
      <div className="w-full h-full bg-transparent flex items-start p-1">
        <div
          className="w-full h-[52px] rounded-2xl border shadow-[0_8px_30px_rgb(0,0,0,0.4)] cursor-pointer group flex items-center px-4 transition-all duration-300"
          style={{ background: 'rgba(15, 12, 41, 0.95)', backdropFilter: 'blur(24px)', borderColor: colors.border, WebkitAppRegion: 'drag' } as any}
          onClick={() => toggleMinimize(false)}
        >
          {/* Accent dot */}
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0 mr-3 pointer-events-none transition-transform group-hover:scale-110" 
            style={{ background: colors.accent, boxShadow: `0 0 10px ${colors.accent}40` }} 
          />
          
          {/* Note Title */}
          <span className="text-[13px] font-bold text-white/90 flex-1 min-w-0 truncate pointer-events-none tracking-wide">
            {note.title || 'Quick Note'}
          </span>
          
          {/* Beautiful Expand Button */}
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/15 group-hover:border-white/20 transition-all duration-300 pointer-events-none ml-2">
            <Maximize2 className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    );
  }

  // NORMAL EDITOR VIEW
  return (
    <div
      className={`relative ${containerClass} rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300`}
      style={{ background: `linear-gradient(135deg, ${colors.bg} 0%, rgba(15, 12, 41, 0.85) 100%)`, backdropFilter: 'blur(28px)', borderColor: colors.border }}
    >
      <div
        className={`relative flex-shrink-0 transition-all duration-300 z-50 ${isDashboard ? 'px-8 py-6' : (headerVisible ? 'px-4 py-4' : 'px-4 py-2 opacity-40 hover:opacity-100')}`}
        onMouseEnter={() => setHeaderVisible(true)}
      >
        <div className="flex items-center gap-3 relative">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: colors.accent }} />
          
          <input
            ref={titleInputRef} value={titleValue} onChange={e => setTitleValue(e.target.value)}
            onFocus={() => editor?.setEditable(false)}
            onBlur={() => { editor?.setEditable(true); onUpdateTitle(titleValue); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur(); }}
            onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
            className={`flex-1 min-w-0 bg-transparent text-white/90 hover:text-white focus:text-white outline-none border-b border-transparent focus:border-white/20 truncate transition-all cursor-text relative z-50 ${isDashboard ? 'text-2xl font-bold py-1' : 'text-sm font-semibold pb-0.5'}`}
            maxLength={60} spellCheck={false} placeholder="Note Title..."
          />
          
          <div className="flex items-center gap-0.5 flex-shrink-0 relative z-50">
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddNote(); }} className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white/80 hover:bg-white/10" title="New Note"><Plus className="w-3.5 h-3.5" /></button>
            
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onShowNotes(); }} className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white/80 hover:bg-white/10" title={isDashboard ? "Toggle Sidebar" : "Open Main App"}><StickyNote className="w-3.5 h-3.5" /></button>
            
            <button onClick={() => setPanel(panel === 'history' ? 'none' : 'history')} className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${panel === 'history' ? 'text-violet-300 bg-violet-500/25' : 'text-white/40 hover:text-white/80 hover:bg-white/10'}`} title="Version history"><Clock className="w-3.5 h-3.5" /></button>
            
            <div className="relative">
              <button onClick={() => setPanel(panel === 'menu' ? 'none' : 'menu')} className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${panel === 'menu' ? 'text-white bg-white/15' : 'text-white/40 hover:text-white/80 hover:bg-white/10'}`} title="More options"><MoreVertical className="w-3.5 h-3.5" /></button>
              {panel === 'menu' && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-[#1a1a2e]/95 backdrop-blur-2xl border border-white/10 rounded-xl p-1 z-[60] shadow-2xl">
                  <MenuItem icon={<Pin className="w-3.5 h-3.5" />} label={note.isPinned ? 'Unpin' : 'Pin'} onClick={() => { onTogglePin(); setPanel('none'); }} />
                  <div className="border-t border-white/5 my-1" />
                  <MenuItem icon={<Trash2 className="w-3.5 h-3.5" />} label="Delete" danger onClick={() => { onDelete(); setPanel('none'); }} />
                </div>
              )}
            </div>
            
            {isWidgetMode && (
              <button onClick={() => toggleMinimize(true)} className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white/80 hover:bg-white/10" title="Minimize"><Minus className="w-3.5 h-3.5" /></button>
            )}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 h-px mx-4 bg-white/5" />

      <div className="flex-1 overflow-hidden relative flex flex-col min-h-0 w-full">
        {panel === 'history' ? (
          <div className="flex-1 px-4 py-3 overflow-hidden">
            <HistoryPanel note={note} onClose={() => setPanel('none')} onRestore={handleRestoreSnapshot} onDelete={onDeleteSnapshot} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 w-full h-full">
            <div className={`flex-shrink-0 pt-3 pb-1 transition-all px-4 ${toolbarVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <EditorToolbar editor={editor} />
            </div>
            <div className={`flex-1 overflow-y-auto tiptap-editor flex flex-col min-h-0 px-4 pb-4`} onClick={(e) => { if (e.target === e.currentTarget) editor?.commands.focus(); }}>
              <EditorContent editor={editor} className="flex-1 w-full h-full min-h-0" />
            </div>
          </div>
        )}
      </div>

      <div 
        className={`flex-shrink-0 flex items-center justify-between px-6 py-2 border-t transition-colors ${isWidgetMode ? 'border-white/5 bg-black/20 hover:bg-black/40 cursor-move' : 'border-transparent bg-transparent'}`} 
        style={isWidgetMode ? { WebkitAppRegion: 'drag' } as any : {}}
      >
        <span className="text-[10px] text-white/20 uppercase tracking-widest font-medium pointer-events-none">{isSaving ? 'Saving...' : 'ZenStick by Talal'}</span>
        {isWidgetMode && <div className="flex items-center justify-center pointer-events-none"><div className="w-12 h-1 bg-white/20 rounded-full" /></div>}
        <span className="text-[10px] text-white/20 pointer-events-none">{wordCount} words</span>
      </div>

      {panel === 'menu' && <div className="fixed inset-0 z-40" onClick={() => setPanel('none')} />}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }: { icon: any; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${danger ? 'text-red-400 hover:bg-red-500/10' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
      {icon}<span>{label}</span>
    </button>
  );
}