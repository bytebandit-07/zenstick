import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, List, ListOrdered, CheckSquare,
  Heading1, Heading2, Code, Quote, Undo2, Redo2
} from 'lucide-react';

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  tip: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, tip, children }: ToolbarButtonProps) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={tip}
      className={[
        'w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150',
        active
          ? 'bg-violet-500/40 text-violet-200'
          : 'text-white/50 hover:text-white/90 hover:bg-white/10',
        disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-white/10 mx-0.5" />;
}

interface EditorToolbarProps {
  editor: Editor | null;
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cmd = editor.chain().focus() as any;

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {/* History */}
      <ToolbarButton
        onClick={() => cmd.undo().run()}
        tip="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => cmd.redo().run()}
        tip="Redo (Ctrl+Y)"
      >
        <Redo2 className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => cmd.toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        tip="Heading 1"
      >
        <Heading1 className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => cmd.toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        tip="Heading 2"
      >
        <Heading2 className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Text formatting */}
      <ToolbarButton
        onClick={() => cmd.toggleBold().run()}
        active={editor.isActive('bold')}
        tip="Bold (Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => cmd.toggleItalic().run()}
        active={editor.isActive('italic')}
        tip="Italic (Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => cmd.toggleCode().run()}
        active={editor.isActive('code')}
        tip="Inline Code"
      >
        <Code className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => cmd.toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        tip="Bullet List"
      >
        <List className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => cmd.toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        tip="Numbered List"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => cmd.toggleTaskList().run()}
        active={editor.isActive('taskList')}
        tip="Checklist"
      >
        <CheckSquare className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Blockquote */}
      <ToolbarButton
        onClick={() => cmd.toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        tip="Quote Block"
      >
        <Quote className="w-3.5 h-3.5" />
      </ToolbarButton>
    </div>
  );
}
