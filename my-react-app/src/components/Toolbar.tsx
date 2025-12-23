import { useWhiteboardStore } from '../store/useWhiteboardStore';
import type { ToolType } from '../types';
import './Toolbar.css';

const PRESET_COLORS = [
  '#1a1a2e',  // Deep navy
  '#e94560',  // Coral red
  '#0f3460',  // Dark blue
  '#16c79a',  // Mint green
  '#f39c12',  // Orange
  '#9b59b6',  // Purple
  '#3498db',  // Sky blue
  '#2c3e50',  // Charcoal
];

const HIGHLIGHTER_COLORS = [
  '#ffd93d80',  // Yellow
  '#6bcb7780',  // Green
  '#ff6b6b80',  // Red
  '#4ecdc480',  // Teal
  '#a8e6cf80',  // Light green
  '#ff8b9480',  // Pink
];

export function Toolbar() {
  const {
    currentTool,
    toolSettings,
    viewState,
    undoStack,
    redoStack,
    canvasState,
    setCurrentTool,
    setToolSettings,
    zoomIn,
    zoomOut,
    resetZoom,
    undo,
    redo,
    deleteSelectedStrokes,
    clearCanvas,
  } = useWhiteboardStore();

  const tools: { id: ToolType; icon: string; label: string }[] = [
    { id: 'pen', icon: '✏️', label: '画笔' },
    { id: 'highlighter', icon: '🖍️', label: '荧光笔' },
    { id: 'eraser', icon: '🧹', label: '橡皮擦' },
    { id: 'lasso', icon: '⭕', label: '圈选' },
    { id: 'pan', icon: '🤚', label: '移动画布' },
  ];

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <span className="toolbar-section-title">工具</span>
        <div className="toolbar-tools">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`toolbar-btn ${currentTool === tool.id ? 'active' : ''}`}
              onClick={() => setCurrentTool(tool.id)}
              title={tool.label}
            >
              <span className="toolbar-icon">{tool.icon}</span>
            </button>
          ))}
        </div>
      </div>

      {(currentTool === 'pen' || currentTool === 'highlighter') && (
        <div className="toolbar-section">
          <span className="toolbar-section-title">
            {currentTool === 'pen' ? '画笔颜色' : '荧光笔颜色'}
          </span>
          <div className="toolbar-colors">
            {(currentTool === 'pen' ? PRESET_COLORS : HIGHLIGHTER_COLORS).map((color) => (
              <button
                key={color}
                className={`color-btn ${
                  (currentTool === 'pen' ? toolSettings.penColor : toolSettings.highlighterColor) === color
                    ? 'active'
                    : ''
                }`}
                style={{ backgroundColor: color }}
                onClick={() =>
                  setToolSettings(
                    currentTool === 'pen'
                      ? { penColor: color }
                      : { highlighterColor: color }
                  )
                }
              />
            ))}
            <input
              type="color"
              className="color-picker"
              value={
                currentTool === 'pen'
                  ? toolSettings.penColor
                  : toolSettings.highlighterColor.slice(0, 7)
              }
              onChange={(e) =>
                setToolSettings(
                  currentTool === 'pen'
                    ? { penColor: e.target.value }
                    : { highlighterColor: e.target.value + '80' }
                )
              }
            />
          </div>
        </div>
      )}

      {(currentTool === 'pen' || currentTool === 'highlighter' || currentTool === 'eraser') && (
        <div className="toolbar-section">
          <span className="toolbar-section-title">
            {currentTool === 'eraser' ? '橡皮擦大小' : '笔迹粗细'}
          </span>
          <div className="toolbar-slider">
            <input
              type="range"
              min={currentTool === 'eraser' ? 10 : 1}
              max={currentTool === 'eraser' ? 50 : currentTool === 'highlighter' ? 40 : 20}
              value={
                currentTool === 'pen'
                  ? toolSettings.penWidth
                  : currentTool === 'highlighter'
                  ? toolSettings.highlighterWidth
                  : toolSettings.eraserWidth
              }
              onChange={(e) =>
                setToolSettings(
                  currentTool === 'pen'
                    ? { penWidth: Number(e.target.value) }
                    : currentTool === 'highlighter'
                    ? { highlighterWidth: Number(e.target.value) }
                    : { eraserWidth: Number(e.target.value) }
                )
              }
            />
            <span className="slider-value">
              {currentTool === 'pen'
                ? toolSettings.penWidth
                : currentTool === 'highlighter'
                ? toolSettings.highlighterWidth
                : toolSettings.eraserWidth}
              px
            </span>
          </div>
        </div>
      )}

      <div className="toolbar-section">
        <span className="toolbar-section-title">缩放 {Math.round(viewState.scale * 100)}%</span>
        <div className="toolbar-zoom">
          <button className="toolbar-btn" onClick={zoomOut} title="缩小">
            <span className="toolbar-icon">➖</span>
          </button>
          <button className="toolbar-btn" onClick={resetZoom} title="重置">
            <span className="toolbar-icon">🔄</span>
          </button>
          <button className="toolbar-btn" onClick={zoomIn} title="放大">
            <span className="toolbar-icon">➕</span>
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <span className="toolbar-section-title">编辑</span>
        <div className="toolbar-actions">
          <button
            className="toolbar-btn"
            onClick={undo}
            disabled={undoStack.length === 0}
            title="撤销"
          >
            <span className="toolbar-icon">↩️</span>
          </button>
          <button
            className="toolbar-btn"
            onClick={redo}
            disabled={redoStack.length === 0}
            title="重做"
          >
            <span className="toolbar-icon">↪️</span>
          </button>
          {canvasState.selectedStrokeIds.length > 0 && (
            <button
              className="toolbar-btn danger"
              onClick={deleteSelectedStrokes}
              title="删除选中"
            >
              <span className="toolbar-icon">🗑️</span>
            </button>
          )}
          <button
            className="toolbar-btn danger"
            onClick={clearCanvas}
            title="清空画布"
          >
            <span className="toolbar-icon">🧼</span>
          </button>
        </div>
      </div>
    </div>
  );
}

