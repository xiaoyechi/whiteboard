import { useRef, useEffect } from 'react';
import { useDraw } from '../hooks/useDraw';

interface DrawBoardProps {
  width?: string;
  height?: string;
}

export const DrawBoard = ({ width = '100%', height = '80vh' }: DrawBoardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    initCanvas,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  } = useDraw();

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
        touchAction: 'none', // 兼容移动端，PC端无影响
        cursor: 'crosshair', // 鼠标样式改为十字准星，提升体验
      }}
      onMouseDown={handleMouseDown}   // 鼠标按下
      onMouseMove={handleMouseMove}   // 鼠标移动
      onMouseUp={handleMouseUp}       // 鼠标松开（画布内）
      onMouseLeave={handleMouseLeave} // 鼠标移出画布
      // 补充：监听全局鼠标松开（避免鼠标在画布外松开导致绘制未停止）
      onMouseUpCapture={handleMouseUp}
    />
  );
};