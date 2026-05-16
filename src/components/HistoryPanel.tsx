import { useState } from 'react';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { Clock, Trash2, RotateCcw, ChevronLeft, FileText } from 'lucide-react';
import { Note, Snapshot } from '../types';

interface HistoryPanelProps {
  note: Note;
  onClose: () => void;
  onRestore: (snapshot: Snapshot) => void;
  onDelete: (snapshotId: string) => void;
}

function formatTime(date: Date): string {
  if (isToday(date)) {
    const diff = differenceInMinutes(new Date(), date);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, h:mm a');
}

function groupByDay(snapshots: Snapshot[]): Record<string, Snapshot[]> {
  const groups: Record<string, Snapshot[]> = {};
  [...snapshots].reverse().forEach(s => {
    const key = isToday(s.timestamp)
      ? 'Today'
      : isYesterday(s.timestamp)
      ? 'Yesterday'
      : format(s.timestamp, 'MMMM d, yyyy');
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });
  return groups;
}

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

interface SnapshotCardProps {
  snapshot: Snapshot;
  isSelected: boolean;
  onSelect: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

function SnapshotCard({ snapshot, isSelected, onSelect, onRestore, onDelete }: SnapshotCardProps) {
  const preview = stripHtml(snapshot.content).slice(0, 120);

  return (
    <div
      onClick={onSelect}
      className={[
        'group history-card',
        isSelected ? 'active' : '',
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-violet-300 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {formatTime(snapshot.timestamp)}
        </span>
        <span className="text-[10px] text-white/30">
          {snapshot.wordCount}w · {snapshot.charCount}c
        </span>
      </div>

      <p className="text-xs text-white/60 leading-relaxed line-clamp-2">
        {preview || '(empty note)'}
      </p>

      {isSelected && (
        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-white/10 animate-fade-in">
          <button
            onClick={e => { e.stopPropagation(); onRestore(); }}
            className="flex items-center gap-1 text-[10px] text-violet-300 hover:text-violet-200 bg-violet-500/20 hover:bg-violet-500/30 px-2.5 py-1 rounded-md transition-all"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            Restore
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-md transition-all"
          >
            <Trash2 className="w-2.5 h-2.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function HistoryPanel({ note, onClose, onRestore, onDelete }: HistoryPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const groups = groupByDay(note.snapshots);
  const groupKeys = Object.keys(groups);

  return (
    <div className="flex flex-col h-full animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/8 hover:bg-white/15 text-white/60 hover:text-white transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-sm font-semibold text-white">Version History</h2>
          <p className="text-[10px] text-white/40">
            {note.snapshots.length} snapshot{note.snapshots.length !== 1 ? 's' : ''} saved
          </p>
        </div>
      </div>

      {/* Snapshots */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {groupKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-white/20" />
            </div>
            <p className="text-xs text-white/30 font-medium">No snapshots yet</p>
            <p className="text-[10px] text-white/20 mt-1">
              Snapshots are saved automatically<br />every 2 seconds while you type
            </p>
          </div>
        ) : (
          groupKeys.map(day => (
            <div key={day}>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2 px-1">
                {day}
              </p>
              <div className="space-y-2">
                {groups[day].map(snapshot => (
                  <SnapshotCard
                    key={snapshot.id}
                    snapshot={snapshot}
                    isSelected={selectedId === snapshot.id}
                    onSelect={() => setSelectedId(
                      selectedId === snapshot.id ? null : snapshot.id
                    )}
                    onRestore={() => {
                      onRestore(snapshot);
                      onClose();
                    }}
                    onDelete={() => {
                      onDelete(snapshot.id);
                      if (selectedId === snapshot.id) setSelectedId(null);
                    }}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Auto-save info */}
      <div className="mt-3 pt-3 border-t border-white/8">
        <p className="text-[10px] text-white/25 text-center leading-relaxed">
          🔄 Auto-saves every 2s of inactivity<br />
          📦 Last 50 snapshots kept per note
        </p>
      </div>
    </div>
  );
}
