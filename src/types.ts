export interface Snapshot {
  id: string;
  content: string; // HTML string
  plainText: string;
  timestamp: Date;
  wordCount: number;
  charCount: number;
  label?: string; // optional user label
}

export interface Note {
  id: string;
  title: string;
  color: NoteColor;
  createdAt: Date;
  updatedAt: Date;
  snapshots: Snapshot[];
  currentContent: string;
  isPinned: boolean;
}

export type NoteColor =
  | 'violet'
  | 'blue'
  | 'emerald'
  | 'rose'
  | 'amber'
  | 'slate';

export const NOTE_COLORS: Record<NoteColor, { bg: string; border: string; accent: string; label: string }> = {
  violet:  { bg: 'rgba(109,40,217,0.18)',  border: 'rgba(167,139,250,0.3)', accent: '#8b5cf6', label: 'Violet'  },
  blue:    { bg: 'rgba(29,78,216,0.18)',   border: 'rgba(96,165,250,0.3)',  accent: '#3b82f6', label: 'Blue'    },
  emerald: { bg: 'rgba(4,120,87,0.18)',    border: 'rgba(52,211,153,0.3)', accent: '#10b981', label: 'Emerald' },
  rose:    { bg: 'rgba(190,18,60,0.18)',   border: 'rgba(251,113,133,0.3)',accent: '#f43f5e', label: 'Rose'    },
  amber:   { bg: 'rgba(180,83,9,0.18)',    border: 'rgba(252,211,77,0.3)', accent: '#f59e0b', label: 'Amber'   },
  slate:   { bg: 'rgba(30,41,59,0.35)',    border: 'rgba(148,163,184,0.3)',accent: '#94a3b8', label: 'Slate'   },
};
