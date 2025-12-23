import { useEffect } from 'react';
import { useWhiteboardStore } from '../store/useWhiteboardStore';
import './HistorySidebar.css';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistorySidebar({ isOpen, onClose }: HistorySidebarProps) {
  const {
    historyRecords,
    currentRecordId,
    loadHistoryRecords,
    loadFromHistory,
    deleteFromHistory,
  } = useWhiteboardStore();

  useEffect(() => {
    loadHistoryRecords();
  }, [loadHistoryRecords]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLoad = (recordId: string) => {
    loadFromHistory(recordId);
    onClose();
  };

  const handleDelete = (e: React.MouseEvent, recordId: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这条记录吗？')) {
      deleteFromHistory(recordId);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="sidebar-overlay" onClick={onClose} />
      <aside className="history-sidebar">
        <div className="sidebar-header">
          <h2>历史记录</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="sidebar-content">
          {historyRecords.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <p>暂无历史记录</p>
              <p className="empty-hint">保存画布后会在这里显示</p>
            </div>
          ) : (
            <ul className="history-list">
              {historyRecords.map((record) => (
                <li
                  key={record.id}
                  className={`history-item ${currentRecordId === record.id ? 'active' : ''}`}
                  onClick={() => handleLoad(record.id)}
                >
                  <div className="history-thumbnail">
                    {record.canvasState.strokes.length > 0 ? (
                      <CanvasThumbnail strokes={record.canvasState.strokes} />
                    ) : (
                      <span className="empty-thumbnail">📝</span>
                    )}
                  </div>
                  <div className="history-info">
                    <span className="history-name">{record.name}</span>
                    <span className="history-meta">
                      {record.canvasState.strokes.length} 笔画 · {formatDate(record.updatedAt)}
                    </span>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDelete(e, record.id)}
                    title="删除"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}

// Simple canvas thumbnail component
function CanvasThumbnail({ strokes }: { strokes: typeof useWhiteboardStore.prototype.canvasState.strokes }) {
  useEffect(() => {
    const canvas = document.getElementById('thumbnail-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Find bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const stroke of strokes) {
      for (const point of stroke.points) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }
    }
    
    const width = maxX - minX || 100;
    const height = maxY - minY || 100;
    const scale = Math.min(60 / width, 40 / height, 1);
    
    ctx.clearRect(0, 0, 60, 40);
    ctx.save();
    ctx.translate(30 - (width * scale) / 2, 20 - (height * scale) / 2);
    ctx.scale(scale, scale);
    ctx.translate(-minX, -minY);
    
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = Math.max(stroke.width * 0.5, 1);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
    
    ctx.restore();
  }, [strokes]);

  return <canvas id="thumbnail-canvas" width={60} height={40} />;
}

