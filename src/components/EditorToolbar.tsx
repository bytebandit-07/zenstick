import React, { useCallback } from 'react';
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
      // 🌟 FIX: Added onMouseDown with preventDefault back! 
      // Yeh button ko focus churanay se rokta hai taake text selection barkarar rahe.
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
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

  // 🌟 FIX: Advanced command runner jo proper chain banata hai
  const runCommand = useCallback((commandFn: (chain: ReturnType<Editor['chain']>) => void) => {
    const chain = editor.chain();
    commandFn(chain);
    chain.focus().run();
  }, [editor]);

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {/* History */}
      <ToolbarButton
        onClick={() => runCommand(c => c.undo())}
        disabled={!editor.can().undo()}
        tip="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => runCommand(c => c.redo())}
        disabled={!editor.can().redo()}
        tip="Redo (Ctrl+Y)"
      >
        <Redo2 className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => runCommand(c => c.toggleHeading({ level: 1 }))}
        active={editor.isActive('heading', { level: 1 })}
        tip="Heading 1"
      >
        <Heading1 className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => runCommand(c => c.toggleHeading({ level: 2 }))}
        active={editor.isActive('heading', { level: 2 })}
        tip="Heading 2"
      >
        <Heading2 className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Text formatting */}
      <ToolbarButton
        onClick={() => runCommand(c => c.toggleBold())}
        active={editor.isActive('bold')}
        tip="Bold (Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => runCommand(c => c.toggleItalic())}
        active={editor.isActive('italic')}
        tip="Italic (Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => runCommand(c => c.toggleCode())}
        active={editor.isActive('code')}
        tip="Inline Code"
      >
        <Code className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => runCommand(c => c.toggleBulletList())}
        active={editor.isActive('bulletList')}
        tip="Bullet List"
      >
        <List className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => runCommand(c => c.toggleOrderedList())}
        active={editor.isActive('orderedList')}
        tip="Numbered List"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => runCommand(c => c.toggleTaskList())}
        active={editor.isActive('taskList')}
        tip="Checklist"
      >
        <CheckSquare className="w-3.5 h-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Blockquote */}
      <ToolbarButton
        onClick={() => runCommand(c => c.toggleBlockquote())}
        active={editor.isActive('blockquote')}
        tip="Quote Block"
      >
        <Quote className="w-3.5 h-3.5" />
      </ToolbarButton>
    </div>
  );
}