import { useEffect } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { PhysicalPosition } from '@tauri-apps/api/dpi';
import ZenWidget from './ZenWidget';
import { Note, Snapshot } from '../types';

interface StandaloneWidgetProps {
  note: Note;
  onUpdateContent: (content: string) => void;
  onUpdateTitle: (title: string) => void;
  onRestoreSnapshot: (snapshot: Snapshot) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onShowNotes: () => void;
  onAddNote: () => void;
  isSaving: boolean;
}

export default function StandaloneWidget(props: StandaloneWidgetProps) {
  useEffect(() => {
    const appWindow = getCurrentWebviewWindow();
    let unlisten: () => void;

    const setupPosition = async () => {
      try {
        const savedX = localStorage.getItem('zen_widget_x');
        const savedY = localStorage.getItem('zen_widget_y');
        
        if (savedX !== null && savedY !== null) {
          await appWindow.setPosition(new PhysicalPosition(parseInt(savedX, 10), parseInt(savedY, 10)));
        }

        unlisten = await appWindow.onMoved((event) => {
           const { x, y } = event.payload;
           localStorage.setItem('zen_widget_x', x.toString());
           localStorage.setItem('zen_widget_y', y.toString());
        });
      } catch (e) {
        console.error("Position logic error:", e);
      }
    };

    setupPosition();

    return () => { if (unlisten) unlisten(); };
  }, []);

  return (
    <div className="w-full h-full overflow-hidden bg-transparent">
      <ZenWidget {...props} />
    </div>
  );
}