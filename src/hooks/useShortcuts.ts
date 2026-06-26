import { useState } from 'react';

export type Shortcuts = {
  newNote: string;
  search: string;
  sidebar: string;
  widget: string;
  deleteNote: string; //  FIX: New delete shortcut
  settings: string;
};

const defaultShortcuts: Shortcuts = {
  newNote: 'Alt+N',
  search: 'Alt+F',
  sidebar: 'Alt+S',
  widget: 'Alt+W',
  deleteNote: 'Alt+D',  
  settings: 'Alt+P',
};

export function useShortcuts() {
  const [shortcuts, setShortcuts] = useState<Shortcuts>(() => {
    const saved = localStorage.getItem('zenstick:shortcuts');
    //  FIX: Safely merge old saved shortcuts with new ones
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultShortcuts, ...parsed }; 
    }
    return defaultShortcuts;
  });

  const updateShortcut = (action: keyof Shortcuts, keys: string) => {
    const newShortcuts = { ...shortcuts, [action]: keys };
    setShortcuts(newShortcuts);
    localStorage.setItem('zenstick:shortcuts', JSON.stringify(newShortcuts));
  };

  return { shortcuts, updateShortcut };
}

export const matchShortcut = (e: KeyboardEvent, shortcut: string) => {
  if (!shortcut) return false;
  const parts = shortcut.split('+');
  const key = parts[parts.length - 1].toLowerCase();
  const ctrl = parts.includes('Ctrl');
  const alt = parts.includes('Alt');
  const shift = parts.includes('Shift');
  
  return (
    (e.ctrlKey || e.metaKey) === ctrl &&
    e.altKey === alt &&
    e.shiftKey === shift &&
    e.key.toLowerCase() === key
  );
};