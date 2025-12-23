import { useRef, useEffect } from 'react';
import { DrawContext } from '../types'; // 导入类型

// 定义 Props 类型
interface DrawBoardProps {
  width?: string;
  height?: string;
  initCanvas: (canvas: HTMLCanvasElement) => void;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: () => void;
  handleMouseLeave: () => void;
}

// 接收 props，不再调用 useDraw()
export const DrawBoard = ({
  width = '100%',
  height = '80vh',
  initCanvas,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleMouseLeave,
}: DrawBoardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 初始化Canvas
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
        cursor: 'crosshair',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseUpCapture={handleMouseUp}
    />
  );
};