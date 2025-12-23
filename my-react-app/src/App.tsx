import { useState, useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { Header } from './components/Header';
import { HistorySidebar } from './components/HistorySidebar';
import { MiniMap } from './components/MiniMap';
import { ShortcutsHelp } from './components/ShortcutsHelp';
import { useWhiteboardStore } from './store/useWhiteboardStore';
import './styles/App.css';

function App() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const {
    setCurrentTool,
    undo,
    redo,
    deleteSelectedStrokes,
    clearSelection,
    saveToHistory,
  } = useWhiteboardStore();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'p':
          case 'b':
            e.preventDefault();
            setCurrentTool('pen');
            break;
          case 'h':
            e.preventDefault();
            setCurrentTool('highlighter');
            break;
          case 'e':
            e.preventDefault();
            setCurrentTool('eraser');
            break;
          case 'l':
          case 's':
            e.preventDefault();
            setCurrentTool('lasso');
            break;
          case 'v':
          case ' ':
            e.preventDefault();
            setCurrentTool('pan');
            break;
          case 'escape':
            e.preventDefault();
            clearSelection();
            break;
          case 'delete':
          case 'backspace':
            e.preventDefault();
            deleteSelectedStrokes();
            break;
          case '?':
            e.preventDefault();
            setShowShortcuts(true);
            break;
        }
      }

      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 's':
            e.preventDefault();
            saveToHistory();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentTool, undo, redo, deleteSelectedStrokes, clearSelection, saveToHistory]);

  return (
    <div className="app">
      <Header onOpenHistory={() => setIsHistoryOpen(true)} />
      
      <main className="main-content">
        <div className="toolbar-container">
          <Toolbar />
        </div>
        
        <div className="canvas-wrapper">
          <Canvas />
          <MiniMap />
        </div>
      </main>
      
      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />
      
      <ShortcutsHelp 
        isOpen={showShortcuts} 
        onClose={() => setShowShortcuts(false)} 
      />
      
      <button 
        className="shortcuts-hint"
        onClick={() => setShowShortcuts(true)}
        title="快捷键帮助"
      >
        ⌨️ ?
      </button>
    </div>
  );
}

export default App;

