import { useState, useEffect } from 'react';
import { Info, Keyboard } from 'lucide-react';
import { Shortcuts } from '../hooks/useShortcuts';

interface ShortcutManagerProps {
  shortcuts: Shortcuts;
  onUpdateShortcut: (action: keyof Shortcuts, keys: string) => void;
}

export default function ShortcutManager({ shortcuts, onUpdateShortcut }: ShortcutManagerProps) {
  const [editingAction, setEditingAction] = useState<keyof Shortcuts | null>(null);

  useEffect(() => {
    if (!editingAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setEditingAction(null);
        return;
      }

      // Ignore single modifier keys (wait for the actual key)
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

      const parts = [];
      if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      
      const key = e.key === ' ' ? 'Space' : (e.key.length === 1 ? e.key.toUpperCase() : e.key);
      parts.push(key);

      onUpdateShortcut(editingAction, parts.join('+'));
      setEditingAction(null);
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [editingAction, onUpdateShortcut]);

  const shortcutLabels: Record<keyof Shortcuts, string> = {
    newNote: 'New Note',
    search: 'Search Notes',
    sidebar: 'Toggle Sidebar',
    widget: 'Launch Widget',
    deleteNote: 'Delete Note',
    settings: 'Toggle Settings'
  };

  return (
    <div className="rounded-2xl border flex flex-col max-h-[350px]" style={{ background: 'rgba(15, 12, 41, 0.70)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.08)' }}>
      {/*  Custom Shortcuts Section */}
      <div className="p-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 mb-3">
          <Keyboard className="w-3 h-3 text-white/30" />
          <p className="text-[9px] font-semibold text-white/30 uppercase tracking-widest">Custom Shortcuts</p>
        </div>
        
        <div className="space-y-2">
          {(Object.keys(shortcuts) as (keyof Shortcuts)[]).map(action => (
            <div key={action} className="flex items-center justify-between group">
              <span className="text-[9px] text-white/35 group-hover:text-white/60 transition-colors">{shortcutLabels[action]}</span>
              
              <button
                onClick={() => setEditingAction(action)}
                className={[
                  'text-[9px] font-mono px-1.5 py-0.5 rounded transition-all',
                  editingAction === action
                    ? 'bg-violet-500/40 text-violet-200 ring-1 ring-violet-400 animate-pulse'
                    : 'bg-white/8 text-white/50 hover:bg-white/20 hover:text-white cursor-pointer'
                ].join(' ')}
              >
                {editingAction === action ? 'Press keys...' : shortcuts[action]}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Fixed Shortcuts Section (Scrollable) */}
      <div className="p-4 pt-2 flex-1 overflow-hidden flex flex-col border-t border-white/5 mt-2">
        <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
          <Info className="w-3 h-3 text-white/30" />
          <p className="text-[9px] font-semibold text-white/30 uppercase tracking-widest">Editor (Fixed)</p>
        </div>
        
        <div className="overflow-y-auto custom-scrollbar pr-1 space-y-1.5 flex-1 min-h-0">
          <ShortcutRow keyStr="Ctrl+B" label="Bold" />
          <ShortcutRow keyStr="Ctrl+I" label="Italic" />
          <ShortcutRow keyStr="Ctrl+E" label="Inline Code" />
          <ShortcutRow keyStr="Ctrl+Z" label="Undo" />
          <ShortcutRow keyStr="Ctrl+Y" label="Redo" />
          
          <div className="h-px bg-white/5 my-1" />
          
          <ShortcutRow keyStr="# Space" label="Heading 1" />
          <ShortcutRow keyStr="## Space" label="Heading 2" />
          <ShortcutRow keyStr="- Space" label="Bullet List" />
          <ShortcutRow keyStr="1. Space" label="Numbered List" />
          <ShortcutRow keyStr="[] Space" label="Checklist" />
          <ShortcutRow keyStr="> Space" label="Quote Block" />
        </div>
      </div>
    </div>
  );
}

//  Local ShortcutRow component for cleaner code
function ShortcutRow({ keyStr, label }: { keyStr: string, label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] text-white/30">{label}</span>
      <span className="text-[9px] font-mono bg-white/5 text-white/40 px-1.5 py-0.5 rounded">{keyStr}</span>
    </div>
  );
}