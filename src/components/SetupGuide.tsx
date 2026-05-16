import { useState, useEffect } from 'react'; // 🌟 Added useEffect here
import {
  Terminal, CheckCircle2, Circle, ChevronDown, ChevronUp,
  Copy, ExternalLink, Rocket, Package, Code2, Cpu
} from 'lucide-react';

interface Step {
  id: number;
  phase: string;
  title: string;
  description: string;
  commands?: string[];
  note?: string;
  link?: { label: string; url: string };
}

const STEPS: Step[] = [
  {
    id: 1,
    phase: 'Phase 1',
    title: 'Install Rust',
    description: 'Rust is required by Tauri for the backend. Install it using rustup, the official Rust installer.',
    commands: ['curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh\n\n# On Windows: Download from\n# https://win.rustup.rs/x86_64'],
    link: { label: 'rustup.rs', url: 'https://rustup.rs' },
    note: 'After installation, restart your terminal and verify with: rustc --version',
  },
  {
    id: 2,
    phase: 'Phase 1',
    title: 'Install Prerequisites (Windows)',
    description: 'On Windows, you need Microsoft C++ Build Tools and WebView2 (usually pre-installed on Win 10/11).',
    commands: ['# Install via winget:\nwinget install Microsoft.VisualStudio.2022.BuildTools\nwinget install Microsoft.EdgeWebView2Runtime'],
    link: { label: 'Tauri Prerequisites Docs', url: 'https://tauri.app/start/prerequisites/' },
  },
  {
    id: 3,
    phase: 'Phase 2',
    title: 'Create the Tauri + React Project',
    description: 'Run this command in any folder to scaffold the full ZenStick project with React + Vite as frontend.',
    commands: [
      'npm create tauri-app@latest zenstick\n# When prompted:\n# ✔ Choose your frontend language: TypeScript / JavaScript\n# ✔ Choose your package manager: npm\n# ✔ Choose your UI template: React\n# ✔ Choose your UI flavor: TypeScript',
      'cd zenstick\nnpm install',
    ],
  },
  {
    id: 4,
    phase: 'Phase 2',
    title: 'Install Frontend Dependencies',
    description: 'Install TipTap (rich text editor), Tailwind CSS, and other UI packages.',
    commands: [
      'npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-task-list @tiptap/extension-task-item @tiptap/extension-placeholder lucide-react date-fns',
      'npm install -D tailwindcss @tailwindcss/vite',
    ],
  },
  {
    id: 5,
    phase: 'Phase 3',
    title: 'Configure tauri.conf.json for Widget Mode',
    description: 'Edit src-tauri/tauri.conf.json to make the window frameless, transparent, and widget-like.',
    commands: [
      `// src-tauri/tauri.conf.json (windows section)
"windows": [{
  "title": "ZenStick",
  "width": 350,
  "height": 500,
  "minWidth": 280,
  "minHeight": 200,
  "resizable": true,
  "decorations": false,
  "transparent": true,
  "alwaysOnTop": false,
  "skipTaskbar": true,
  "shadow": true
}]`,
    ],
    note: 'decorations: false removes the title bar. transparent: true enables the glass blur effect.',
  },
  {
    id: 6,
    phase: 'Phase 4',
    title: 'Copy the Frontend Code',
    description: 'Copy the src/ folder contents from this demo into your Tauri project\'s src/ folder. All components are ready!',
    note: '📁 Components: ZenWidget.tsx, EditorToolbar.tsx, HistoryPanel.tsx, NotesSidebar.tsx\n📁 Hooks: useNotes.ts\n📁 Types: types.ts',
  },
  {
    id: 7,
    phase: 'Phase 5',
    title: 'Add SQLite Backend (Rust)',
    description: 'Add the tauri-plugin-sql crate for a proper SQLite database instead of localStorage.',
    commands: [
      '# In src-tauri/Cargo.toml:\n[dependencies]\ntauri-plugin-sql = { version = "2", features = ["sqlite"] }',
      '# In src-tauri/src/main.rs:\nfn main() {\n    tauri::Builder::default()\n        .plugin(tauri_plugin_sql::Builder::default().build())\n        .run(tauri::generate_context!())\n        .expect("error while running tauri application");\n}',
    ],
    link: { label: 'tauri-plugin-sql docs', url: 'https://crates.io/crates/tauri-plugin-sql' },
  },
  {
    id: 8,
    phase: 'Phase 5',
    title: 'System Tray Integration',
    description: 'Make the app live in the system tray so it doesn\'t appear in the taskbar.',
    commands: [
      `// src-tauri/src/main.rs
use tauri::{SystemTray, SystemTrayEvent, SystemTrayMenu, CustomMenuItem};

fn main() {
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show", "Show ZenStick"))
        .add_item(CustomMenuItem::new("quit", "Quit"));

    tauri::Builder::default()
        .system_tray(SystemTray::new().with_menu(tray_menu))
        .on_system_tray_event(|app, event| {
            if let SystemTrayEvent::MenuItemClick { id, .. } = event {
                match id.as_str() {
                    "show" => { app.get_window("main").unwrap().show().unwrap(); }
                    "quit"  => { app.exit(0); }
                    _ => {}
                }
            }
        })
        .run(tauri::generate_context!())
        .unwrap();
}`,
    ],
  },
  {
    id: 9,
    phase: 'Phase 6',
    title: 'Run in Development Mode',
    description: 'Start the Tauri dev server. This will open the native window with hot-reload!',
    commands: ['npm run tauri dev'],
    note: 'First build takes 3-5 min (Rust compiles). Subsequent builds are fast (~10 sec).',
  },
  {
    id: 10,
    phase: 'Phase 6',
    title: 'Build for Production',
    description: 'Build the final installable .exe / .msi / .dmg (depending on your OS).',
    commands: ['npm run tauri build\n# Output: src-tauri/target/release/bundle/'],
    note: '🎉 Final app size ≈ 5-10 MB. RAM usage ≈ 30-40 MB. Compare to Electron\'s 150 MB+!',
  },
];

const PHASE_COLORS: Record<string, string> = {
  'Phase 1': '#3b82f6',
  'Phase 2': '#8b5cf6',
  'Phase 3': '#10b981',
  'Phase 4': '#f59e0b',
  'Phase 5': '#f43f5e',
  'Phase 6': '#06b6d4',
};

interface StepCardProps {
  step: Step;
  isCompleted: boolean;
  onToggle: () => void;
}

function StepCard({ step, isCompleted, onToggle }: StepCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const phaseColor = PHASE_COLORS[step.phase] || '#8b5cf6';

  const copyCommand = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd).catch(() => {});
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div
      className={[
        'rounded-xl border transition-all duration-200',
        isCompleted
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-white/10 bg-white/4',
      ].join(' ')}
    >
      {/* Step header */}
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={onToggle}
          className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
        >
          {isCompleted
            ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            : <Circle className="w-5 h-5 text-white/25 hover:text-white/50" />
          }
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{ color: phaseColor, background: phaseColor + '20' }}
            >
              {step.phase}
            </span>
            <span className="text-[10px] text-white/30">Step {step.id}</span>
          </div>
          <h3 className={`text-sm font-semibold ${isCompleted ? 'text-white/50 line-through' : 'text-white'}`}>
            {step.title}
          </h3>
          <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{step.description}</p>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/12 text-white/40 hover:text-white transition-all"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          {step.commands?.map((cmd, i) => (
            <div key={i} className="relative">
              <pre className="text-xs text-violet-200/80 bg-black/40 rounded-lg p-3 overflow-x-auto leading-relaxed border border-white/8 font-mono">
                {cmd}
              </pre>
              <button
                onClick={() => copyCommand(cmd, i)}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition-all"
                title="Copy"
              >
                {copiedIndex === i
                  ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  : <Copy className="w-3 h-3" />
                }
              </button>
            </div>
          ))}

          {step.note && (
            <div className="flex gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <span className="text-amber-400 flex-shrink-0 text-sm">💡</span>
              <p className="text-xs text-amber-200/70 leading-relaxed whitespace-pre-line">{step.note}</p>
            </div>
          )}

          {step.link && (
            <a
              href={step.link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {step.link.label}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function SetupGuide() {
  // 🌟 Initialize from localStorage instead of memory
  const [completed, setCompleted] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('zenstick:setup_progress');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // 🌟 Sync to localStorage whenever 'completed' Set changes
  useEffect(() => {
    localStorage.setItem('zenstick:setup_progress', JSON.stringify(Array.from(completed)));
  }, [completed]);

  const toggleStep = (id: number) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const progress = Math.round((completed.size / STEPS.length) * 100);
  const phases = [...new Set(STEPS.map(s => s.phase))];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-white/8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">ZenStick Setup Guide</h2>
            <p className="text-xs text-white/40">From zero to running Tauri app</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-white/40">
            <span>{completed.size}/{STEPS.length} steps complete</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Tech stack pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { icon: <Cpu className="w-3 h-3" />, label: 'Tauri + Rust', color: '#f97316' },
            { icon: <Code2 className="w-3 h-3" />, label: 'React + Vite', color: '#61dafb' },
            { icon: <Package className="w-3 h-3" />, label: 'TipTap Editor', color: '#8b5cf6' },
            { icon: <Terminal className="w-3 h-3" />, label: 'SQLite DB', color: '#10b981' },
          ].map(pill => (
            <span
              key={pill.label}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium"
              style={{ color: pill.color, background: pill.color + '20', border: `1px solid ${pill.color}30` }}
            >
              {pill.icon}
              {pill.label}
            </span>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {phases.map(phase => (
          <div key={phase}>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="h-px flex-1"
                style={{ background: `${PHASE_COLORS[phase]}40` }}
              />
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ color: PHASE_COLORS[phase], background: PHASE_COLORS[phase] + '15' }}
              >
                {phase}
              </span>
              <div
                className="h-px flex-1"
                style={{ background: `${PHASE_COLORS[phase]}40` }}
              />
            </div>
            <div className="space-y-2">
              {STEPS.filter(s => s.phase === phase).map(step => (
                <StepCard
                  key={step.id}
                  step={step}
                  isCompleted={completed.has(step.id)}
                  onToggle={() => toggleStep(step.id)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Done banner */}
        {completed.size === STEPS.length && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center animate-fade-in">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-base font-bold text-emerald-400 mb-1">ZenStick is ready!</h3>
            <p className="text-xs text-emerald-300/60">
              Your lightweight widget is running. Enjoy those tiny RAM numbers!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}