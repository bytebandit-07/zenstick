import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Clock, List, MoreVertical, Pin, Trash2,
  CheckCircle, StickyNote, Minus,
  Maximize2, Minimize2
} from 'lucide-react';
import { Note, NOTE_COLORS, Snapshot } from '../types';
import EditorToolbar from './EditorToolbar';
import HistoryPanel from './HistoryPanel';

interface ZenWidgetProps {
  note: Note;
  onUpdateContent: (content: string) => void;
  onUpdateTitle: (title: string) => void;
  onRestoreSnapshot: (snapshot: Snapshot) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onShowNotes: () => void;
  isSaving: boolean;
}

type Panel = 'none' | 'history' | 'menu';

export default function ZenWidget({
  note,
  onUpdateContent,
  onUpdateTitle,
  onRestoreSnapshot,
  onDeleteSnapshot,
  onTogglePin,
  onDelete,
  onShowNotes,
  isSaving,
}: ZenWidgetProps) {
  const [panel, setPanel] = useState<Panel>('none');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [titleValue, setTitleValue] = useState(note.title);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const colors = NOTE_COLORS[note.color];

  // 1. Sync Title
  useEffect(() => {
    setTitleValue(note.title);
  }, [note.id, note.title]);

  // 2. Initialize Editor FIRST
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: 'Start typing your thoughts… ✨',
      }),
    ],
    content: note.currentContent,
    onUpdate: ({ editor }) => {
      onUpdateContent(editor.getHTML());
    },
    onFocus: () => setToolbarVisible(true),
    onBlur: () => setTimeout(() => setToolbarVisible(false), 150),
    editorProps: {
      attributes: { class: 'tiptap-editor', spellcheck: 'true' },
    },
  });

  // 3. Sync Editor Content AFTER Editor is initialized
  useEffect(() => {
    if (editor && note.currentContent !== editor.getHTML()) {
      editor.commands.setContent(note.currentContent, { emitUpdate: false });
    }
  }, [note.id, note.currentContent, editor]); // ✨ PERFECT SYNC ARRAY

  const handleRestoreSnapshot = useCallback((snapshot: Snapshot) => {
    onRestoreSnapshot(snapshot);
    editor?.commands.setContent(snapshot.content, { emitUpdate: false });
    setPanel('none');
  }, [editor, onRestoreSnapshot]);

  const wordCount = editor ? editor.getText().trim().split(/\s+/).filter(Boolean).length : 0;

  const togglePanel = (p: Panel) => {
    setPanel(prev => prev === p ? 'none' : p);
  };

  const widgetHeight = isExpanded ? 'h-[90vh] max-h-[700px]' : 'h-[500px]';

  if (isMinimized) {
    return (
      <div
        className="w-[280px] rounded-2xl border shadow-2xl overflow-hidden cursor-pointer group"
        style={{ background: 'rgba(15, 12, 41, 0.82)', backdropFilter: 'blur(24px)', borderColor: colors.border }}
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors.accent }} />
          <span className="text-sm font-semibold text-white/90 flex-1 truncate">{note.title || 'New Note'}</span>
          <div className="w-5 h-5 flex items-center justify-center">
            <Maximize2 className="w-3 h-3 text-white/30 group-hover:text-white/60" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col w-[350px] ${widgetHeight} rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300`}
      style={{ background: `linear-gradient(135deg, ${colors.bg} 0%, rgba(15, 12, 41, 0.80) 100%)`, backdropFilter: 'blur(28px)', borderColor: colors.border }}
    >
      {/* ===== HEADER ===== */}
      <div
        className={`relative flex-shrink-0 px-4 transition-all duration-300 z-50 ${headerVisible ? 'py-4' : 'py-2 opacity-40 hover:opacity-100'}`}
        onMouseEnter={() => setHeaderVisible(true)}
      >
        <div className="flex items-center gap-2 relative">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: colors.accent }} />

          {/* 🛑 THE KILL-SWITCH INPUT */}
          <input
            ref={titleInputRef}
            value={titleValue}
            onChange={e => setTitleValue(e.target.value)}
            onFocus={() => editor?.setEditable(false)}
            onBlur={() => {
              editor?.setEditable(true);
              onUpdateTitle(titleValue);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                e.currentTarget.blur();
              }
            }}
            onMouseDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
            className="flex-1 bg-transparent text-sm font-semibold text-white/90 hover:text-white focus:text-white outline-none border-b border-transparent focus:border-white/20 pb-0.5 truncate transition-all cursor-text relative z-50"
            maxLength={40}
            spellCheck={false}
            placeholder="Note Title..."
          />

          <div className="flex items-center gap-0.5 flex-shrink-0 relative z-50">
            <button onClick={onShowNotes} className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white/80 hover:bg-white/10"><StickyNote className="w-3.5 h-3.5" /></button>
            <button onClick={() => togglePanel('history')} className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${panel === 'history' ? 'text-violet-300 bg-violet-500/25' : 'text-white/40 hover:text-white/80 hover:bg-white/10'}`}><Clock className="w-3.5 h-3.5" /></button>
            <div className="relative">
              <button onClick={() => togglePanel('menu')} className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${panel === 'menu' ? 'text-white bg-white/15' : 'text-white/40 hover:text-white/80 hover:bg-white/10'}`}><MoreVertical className="w-3.5 h-3.5" /></button>
              {panel === 'menu' && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-[#1a1a2e]/95 backdrop-blur-2xl border border-white/10 rounded-xl p-1 z-[60] shadow-2xl">
                  <MenuItem icon={<Pin className="w-3.5 h-3.5" />} label={note.isPinned ? 'Unpin' : 'Pin'} onClick={() => { onTogglePin(); setPanel('none'); }} />
                  <MenuItem icon={isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />} label={isExpanded ? 'Collapse' : 'Expand'} onClick={() => { setIsExpanded(!isExpanded); setPanel('none'); }} />
                  <div className="border-t border-white/5 my-1" />
                  <MenuItem icon={<Trash2 className="w-3.5 h-3.5" />} label="Delete" danger onClick={() => { onDelete(); setPanel('none'); }} />
                </div>
              )}
            </div>
            <button onClick={() => setIsMinimized(true)} className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white/80 hover:bg-white/10"><Minus className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 h-px mx-4 bg-white/5" />

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-hidden relative">
        {panel === 'history' ? (
          <div className="absolute inset-0 px-4 py-3">
            <HistoryPanel note={note} onClose={() => setPanel('none')} onRestore={handleRestoreSnapshot} onDelete={onDeleteSnapshot} />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col">
            <div className={`flex-shrink-0 px-4 pt-2 pb-1 transition-all ${toolbarVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <EditorToolbar editor={editor} />
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 tiptap-editor" onClick={(e) => { if (e.target === e.currentTarget) editor?.commands.focus(); }}>
              <EditorContent editor={editor} />
            </div>
          </div>
        )}
      </div>

      {/* 🚀 PURE CSS FOOTER DRAG REGION - (No data-tauri-drag-region attribute) */}
      <div 
        className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-t border-white/5 bg-black/20 hover:bg-black/40 transition-colors cursor-move"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <span className="text-[10px] text-white/20 uppercase tracking-widest font-medium pointer-events-none">
          {isSaving ? 'Saving...' : 'ZenStick'}
        </span>
        <div className="flex items-center justify-center pointer-events-none">
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>
        <span className="text-[10px] text-white/20 pointer-events-none">{wordCount} words</span>
      </div>

      {panel !== 'none' && <div className="fixed inset-0 z-40" onClick={() => setPanel('none')} />}
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