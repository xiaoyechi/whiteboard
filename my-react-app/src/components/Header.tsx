import { useState } from 'react';
import { useWhiteboardStore } from '../store/useWhiteboardStore';
import './Header.css';

interface HeaderProps {
  onOpenHistory: () => void;
}

export function Header({ onOpenHistory }: HeaderProps) {
  const { saveToHistory, newCanvas, currentRecordId } = useWhiteboardStore();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    saveToHistory();
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleNew = () => {
    if (confirm('创建新画布？当前内容会被保存。')) {
      saveToHistory();
      newCanvas();
    }
  };

  return (
    <header className="header">
      <div className="header-brand">
        <div className="logo">
          <span className="logo-icon">🎨</span>
          <span className="logo-text">seyou白板</span>
        </div>
        {currentRecordId && (
          <span className="header-status">已保存</span>
        )}
      </div>
      
      <div className="header-actions">
        <button className="header-btn" onClick={handleNew}>
          <span className="btn-icon">📄</span>
          <span>新建</span>
        </button>
        <button className="header-btn primary" onClick={handleSave} disabled={isSaving}>
          <span className="btn-icon">{isSaving ? '✅' : '💾'}</span>
          <span>{isSaving ? '已保存' : '保存'}</span>
        </button>
        <button className="header-btn" onClick={onOpenHistory}>
          <span className="btn-icon">📚</span>
          <span>历史记录</span>
        </button>
      </div>
    </header>
  );
}

