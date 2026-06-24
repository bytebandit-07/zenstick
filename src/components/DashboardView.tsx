import { FileText, Pin, Clock, Plus, ArrowRight, Library, Sparkles } from 'lucide-react';
import { Note, NOTE_COLORS } from '../types';

interface DashboardViewProps {
  notes: Note[];
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onViewAllNotes: () => void; // 🌟 Naya prop: View All Notes
}

export default function DashboardView({ notes, onSelectNote, onCreateNote, onViewAllNotes }: DashboardViewProps) {
  const pinnedCount = notes.filter(n => n.isPinned).length;
  const totalSnapshots = notes.reduce((acc, n) => acc + n.snapshots.length, 0);
  const recentNotes = notes.slice(0, 4); // Top 4 recent notes

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex flex-col h-full bg-[#0a0a16]/40 text-white/90 p-8 overflow-y-auto custom-scrollbar">
      
      {/* 🌟 GREETING SECTION */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          {greeting}, Talal <Sparkles className="w-6 h-6 text-violet-400" />
        </h1>
        <p className="text-white/40 text-sm">Here is a quick overview of your ZenStick workspace.</p>
      </div>

      {/* 🌟 STATS CARDS */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard icon={<FileText className="w-5 h-5 text-blue-400" />} label="Total Notes" value={notes.length} color="blue" />
        <StatCard icon={<Pin className="w-5 h-5 text-emerald-400" />} label="Pinned Notes" value={pinnedCount} color="emerald" />
        <StatCard icon={<Clock className="w-5 h-5 text-amber-400" />} label="Snapshots Saved" value={totalSnapshots} color="amber" />
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* 🌟 RECENT ACTIVITY */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/50">Recent Notes</h2>
          </div>
          <div className="space-y-2">
            {recentNotes.length === 0 ? (
              <div className="p-4 rounded-xl border border-white/5 bg-white/5 text-center text-xs text-white/30">No notes found.</div>
            ) : (
              recentNotes.map(note => {
                const colorDef = NOTE_COLORS[note.color];
                return (
                  <div 
                    key={note.id}
                    onClick={() => onSelectNote(note.id)}
                    className="group flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-black/20 hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: colorDef.accent }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white/80 truncate group-hover:text-white transition-colors">{note.title}</p>
                        <p className="text-[10px] text-white/30">{new Date(note.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-white/40 transition-transform group-hover:translate-x-1" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 🌟 QUICK ACTIONS */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/50">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3">
            <button onClick={onCreateNote} className="flex items-center gap-4 p-4 rounded-xl border border-violet-500/20 bg-violet-500/10 hover:bg-violet-500/20 transition-all group text-left">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-violet-100">Create New Note</p>
                <p className="text-[10px] text-violet-300/50">Start a fresh thought in the editor</p>
              </div>
            </button>

            {/* 🌟 NAYA BUTTON: Browse All Notes */}
            <button onClick={onViewAllNotes} className="flex items-center gap-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 transition-all group text-left">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Library className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-100">Browse All Notes</p>
                <p className="text-[10px] text-blue-300/50">Open the editor sidebar to view your complete workspace</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  return (
    <div className="p-5 rounded-2xl border border-white/5 bg-black/20 relative overflow-hidden group hover:border-white/10 transition-colors">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-3xl opacity-20 bg-${color}-500 group-hover:opacity-40 transition-opacity`} />
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>{icon}</div>
        <span className="text-xs font-semibold uppercase tracking-widest text-white/40">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white/90">{value}</p>
    </div>
  );
}