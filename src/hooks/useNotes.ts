import { useState, useEffect, useCallback, useRef } from 'react';
import { Note, Snapshot, NoteColor } from '../types';
import { getDb } from '../db/database';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function getPlainText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string>('');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addNote = useCallback(async (color: NoteColor = 'violet') => {
    const id = generateId();
    const newNote: Note = {
      id, title: 'New Note', color, createdAt: new Date(), updatedAt: new Date(),
      snapshots: [], currentContent: '', isPinned: false,
    };
    const db = await getDb();
    await db.execute(
      "INSERT INTO notes (id, title, content, color, is_pinned, snapshots) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, newNote.title, '', newNote.color, 0, JSON.stringify([])]
    );
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(id);
    localStorage.setItem('zenstick_db_sync', Date.now().toString()); 
    return id;
  }, []);

  const loadFromSql = useCallback(async () => {
    try {
      const db = await getDb();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY, title TEXT, content TEXT, color TEXT,
          is_pinned INTEGER DEFAULT 0, snapshots TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 🌟 UNIFIED DB FIX: Saare notes load honge, no hiding!
      const result = await db.select<any[]>("SELECT * FROM notes ORDER BY is_pinned DESC, updated_at DESC");
      
      if (result.length > 0) {
        const mapped = result.map(n => ({
          ...n, currentContent: n.content || '', color: n.color || 'violet',
          isPinned: n.is_pinned === 1, updatedAt: new Date(n.updated_at),
          snapshots: n.snapshots ? JSON.parse(n.snapshots) : []
        }));
        setNotes(mapped);
        setActiveNoteId(prev => prev || mapped[0].id);
      } else {
        await addNote('violet');
      }
    } catch (e) { console.error("Load error:", e); }
  }, [addNote]);

  useEffect(() => { loadFromSql(); }, [loadFromSql]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'zenstick_db_sync') loadFromSql();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadFromSql]);

  const updateNoteContent = useCallback((noteId: string, content: string) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, currentContent: content, updatedAt: new Date() } : n));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const db = await getDb();
      setNotes(prev => {
        return prev.map(n => {
          if (n.id !== noteId) return n;
          const plain = getPlainText(content);
          const last = n.snapshots[n.snapshots.length - 1];
          let newSnapshots = [...n.snapshots];
          if (plain.trim() && (!last || last.content !== content)) {
            const snapshot: Snapshot = {
              id: generateId(), content: content, plainText: plain, timestamp: new Date(),
              wordCount: plain.trim().split(/\s+/).filter(Boolean).length, charCount: plain.length,
            };
            newSnapshots = [...newSnapshots, snapshot].slice(-50);
          }
          db.execute("UPDATE notes SET content = $1, snapshots = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3", [content, JSON.stringify(newSnapshots), noteId]);
          return { ...n, snapshots: newSnapshots };
        });
      });
    }, 2000);
  }, []);

  const updateNoteTitle = useCallback(async (noteId: string, title: string) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, title, updatedAt: new Date() } : n));
    const db = await getDb();
    await db.execute("UPDATE notes SET title = $1 WHERE id = $2", [title, noteId]);
    localStorage.setItem('zenstick_db_sync', Date.now().toString());
  }, []);

  const updateNoteColor = useCallback(async (noteId: string, color: NoteColor) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, color, updatedAt: new Date() } : n));
    try {
      const db = await getDb();
      await db.execute("UPDATE notes SET color = $1 WHERE id = $2", [color, noteId]);
      localStorage.setItem('zenstick_db_sync', Date.now().toString());
    } catch (error) { console.error("Failed to update color in SQL:", error); }
  }, []);

  const togglePin = useCallback(async (noteId: string) => {
    const noteToToggle = notes.find(n => n.id === noteId);
    if (!noteToToggle) return;
    const newPinStatus = !noteToToggle.isPinned;
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, isPinned: newPinStatus } : n));
    const db = await getDb();
    await db.execute("UPDATE notes SET is_pinned = $1 WHERE id = $2", [newPinStatus ? 1 : 0, noteId]);
    localStorage.setItem('zenstick_db_sync', Date.now().toString());
  }, [notes]);

  const deleteNote = useCallback(async (noteId: string) => {
    const db = await getDb();
    await db.execute("DELETE FROM notes WHERE id = $1", [noteId]);
    setNotes(prev => {
      const filtered = prev.filter(n => n.id !== noteId);
      if (filtered.length === 0) { addNote('violet'); return []; }
      if (noteId === activeNoteId) setActiveNoteId(filtered[0].id);
      return filtered;
    });
    localStorage.setItem('zenstick_db_sync', Date.now().toString());
  }, [activeNoteId, addNote]);

  const activeNote = notes.find(n => n.id === activeNoteId) || notes[0];

  return {
    notes, activeNote, activeNoteId, setActiveNoteId,
    updateNoteContent, updateNoteTitle, updateNoteColor,
    togglePin, addNote, deleteNote,
    restoreSnapshot: (id: string, s: Snapshot) => updateNoteContent(id, s.content),
    deleteSnapshot: (id: string, sId: string) => {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, snapshots: n.snapshots.filter(s => s.id !== sId) } : n));
      localStorage.setItem('zenstick_db_sync', Date.now().toString());
    }
  };
}