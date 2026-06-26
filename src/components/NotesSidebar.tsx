import { useState, useMemo } from 'react';
import { Plus, Pin, Trash2, Palette, Search } from 'lucide-react';
import { Note, NoteColor, NOTE_COLORS } from '../types';
import { format, isToday, isYesterday } from 'date-fns';

interface NotesSidebarProps {
  notes: Note[];
  activeNoteId: string;
  onSelectNote: (id: string) => void;
  onAddNote: (color: NoteColor) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onClose: () => void;
}

function formatDate(date: Date): string {
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

export default function NotesSidebar({
  notes, activeNoteId, onSelectNote, onAddNote, onDeleteNote, onTogglePin
}: NotesSidebarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  //  FIX: New State for Search Query
  const [searchQuery, setSearchQuery] = useState('');

  //  FIX: Real-time filtering logic
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    
    const query = searchQuery.toLowerCase();
    return notes.filter(note => {
      const titleMatch = (note.title || 'Untitled Note').toLowerCase().includes(query);
      const contentMatch = stripHtml(note.currentContent).toLowerCase().includes(query);
      return titleMatch || contentMatch;
    });
  }, [notes, searchQuery]);

  return (
    <div className="flex flex-col h-full animate-slide-in-left">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-white">All Notes</h2>
          <p className="text-[10px] text-white/40">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-1">
          {/* New Note Button */}
          <div className="relative">
            <button
              data-tour="add-note"
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="New Note"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-violet-500/30 hover:bg-violet-500/50 text-violet-300 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
            
            {showColorPicker && (
              <div className="absolute right-0 top-full mt-1.5 w-36 bg-black/85 backdrop-blur-2xl border border-white/10 rounded-xl p-2.5 z-50 animate-fade-in shadow-2xl">
                <p className="text-[9px] text-white/40 uppercase tracking-widest mb-2 px-0.5">Pick color</p>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(NOTE_COLORS) as [NoteColor, typeof NOTE_COLORS[NoteColor]][]).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => { onAddNote(key); setShowColorPicker(false); }}
                      title={val.label}
                      className="w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 flex-shrink-0"
                      style={{ background: val.bg, borderColor: val.accent }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/*  FIX: Sleek Search Bar */}
      <div className="mb-4 relative flex-shrink-0">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-3.5 w-3.5 text-white/40" />
        </div>
        <input
          id="search-input" // FIX: Added this ID
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes..."
          className="w-full pl-9 pr-3 py-2 bg-black/20 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all shadow-inner"
        />
      </div>

      {/* Notes list */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-white/30">
            <Search className="w-6 h-6 mb-2 opacity-20" />
            <p className="text-xs">No notes found</p>
          </div>
        ) : (
          filteredNotes.map(note => {
            const colors = NOTE_COLORS[note.color];
            const preview = stripHtml(note.currentContent).slice(0, 80);
            const isActive = note.id === activeNoteId;
            const isHovered = hoveredId === note.id;

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                onMouseEnter={() => setHoveredId(note.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={[
                  'group relative rounded-xl p-3 cursor-pointer transition-all duration-150 border',
                  isActive
                    ? 'border-opacity-60'
                    : 'border-transparent hover:border-white/10',
                ].join(' ')}
                style={{
                  background: isActive ? colors.bg : isHovered ? 'rgba(255,255,255,0.05)' : 'transparent',
                  borderColor: isActive ? colors.border : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: colors.accent }}
                      />
                      <p className="text-xs font-semibold text-white/90 truncate">{note.title || 'Untitled Note'}</p>
                      {note.isPinned && (
                        <Pin className="w-2.5 h-2.5 text-white/40 fill-current flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-white/35 leading-relaxed line-clamp-2 pl-3.5">
                      {preview || 'Empty note'}
                    </p>
                  </div>
                  <span className="text-[9px] text-white/25 flex-shrink-0">
                    {formatDate(note.updatedAt)}
                  </span>
                </div>

                {/* Actions on hover */}
                {(isHovered || isActive) && (
                  <div
                    onClick={e => e.stopPropagation()}
                    className="absolute right-2 bottom-2 flex items-center gap-1 animate-fade-in"
                  >
                    <button
                      onClick={() => onTogglePin(note.id)}
                      title={note.isPinned ? 'Unpin' : 'Pin'}
                      className={[
                        'w-5 h-5 flex items-center justify-center rounded-md transition-all',
                        note.isPinned
                          ? 'text-violet-300 bg-violet-500/20'
                          : 'text-white/30 hover:text-white/60 hover:bg-white/10',
                      ].join(' ')}
                    >
                      <Pin className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      title="Delete note"
                      className="w-5 h-5 flex items-center justify-center rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/15 transition-all"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 mt-3 pt-3 border-t border-white/8">
        <p className="text-[10px] text-white/25 text-center">
          <Palette className="w-2.5 h-2.5 inline mr-1" />
          Click + to create a colored note
        </p>
      </div>
    </div>
  );
}