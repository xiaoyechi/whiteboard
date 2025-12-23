// src/components/DrawBoard.tsx
import { useRef, useEffect } from 'react';
import { DrawMode } from '../types';

// 定义 DrawBoard 的 Props 类型
interface DrawBoardProps {
  width?: string;
  height?: string;
  initCanvas: (canvas: HTMLCanvasElement) => void;
  drawMode: DrawMode;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: () => void;
  handleMouseLeave: () => void;
}

export const DrawBoard = ({
  width = '100%',
  height = '80vh',
  initCanvas,
  drawMode,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleMouseLeave,
}: DrawBoardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 初始化 Canvas
  useEffect(() => {
    if (canvasRef.current) {
      initCanvas(canvasRef.current);
    }
  }, [initCanvas]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width,
        height,
        border: '1px solid #ccc',
        touchAction: 'none',
        // 适配模式的鼠标样式
        cursor: drawMode === 'draw' ? 'crosshair' : 'pointer', // 无图标时用 pointer 替代
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseUpCapture={handleMouseUp}
    />
  );
};