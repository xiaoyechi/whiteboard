import { useRef, useEffect, useCallback } from 'react';
import { useWhiteboardStore } from '../store/useWhiteboardStore';
import './MiniMap.css';

export function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { canvasState, viewState, setViewState } = useWhiteboardStore();
  
  const MINIMAP_WIDTH = 180;
  const MINIMAP_HEIGHT = 120;
  const CANVAS_SIZE = 2000; // Assumed canvas size

  // Calculate viewport rectangle
  const getViewportRect = useCallback(() => {
    const viewportWidth = window.innerWidth - 250; // Account for toolbar
    const viewportHeight = window.innerHeight - 70; // Account for header
    
    const scale = Math.min(MINIMAP_WIDTH / CANVAS_SIZE, MINIMAP_HEIGHT / CANVAS_SIZE);
    
    return {
      x: (-viewState.offsetX / viewState.scale) * scale + MINIMAP_WIDTH / 2 - (viewportWidth / viewState.scale) * scale / 2,
      y: (-viewState.offsetY / viewState.scale) * scale + MINIMAP_HEIGHT / 2 - (viewportHeight / viewState.scale) * scale / 2,
      width: (viewportWidth / viewState.scale) * scale,
      height: (viewportHeight / viewState.scale) * scale,
    };
  }, [viewState]);

  // Render minimap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);
    
    // Calculate bounds of all strokes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (const stroke of canvasState.strokes) {
      for (const point of stroke.points) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }
    }
    
    if (canvasState.strokes.length > 0) {
      const contentWidth = maxX - minX || 100;
      const contentHeight = maxY - minY || 100;
      const scale = Math.min(
        (MINIMAP_WIDTH - 20) / contentWidth,
        (MINIMAP_HEIGHT - 20) / contentHeight,
        0.1
      );
      
      ctx.save();
      ctx.translate(MINIMAP_WIDTH / 2, MINIMAP_HEIGHT / 2);
      ctx.scale(scale, scale);
      ctx.translate(-(minX + contentWidth / 2), -(minY + contentHeight / 2));
      
      // Draw strokes
      for (const stroke of canvasState.strokes) {
        if (stroke.points.length < 2) continue;
        
        ctx.strokeStyle = stroke.type === 'highlighter' 
          ? stroke.color.replace('80', 'ff') 
          : stroke.color;
        ctx.lineWidth = Math.max(stroke.width * 0.5, 2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = stroke.type === 'highlighter' ? 0.5 : 1;
        
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      
      ctx.restore();
    }
    
    // Draw viewport rectangle
    const viewport = getViewportRect();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      Math.max(0, viewport.x),
      Math.max(0, viewport.y),
      Math.min(viewport.width, MINIMAP_WIDTH - viewport.x),
      Math.min(viewport.height, MINIMAP_HEIGHT - viewport.y)
    );
    
  }, [canvasState, viewState, getViewportRect]);

  // Handle click to navigate
  const handleClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Convert minimap coordinates to canvas coordinates
    const scale = Math.min(MINIMAP_WIDTH / CANVAS_SIZE, MINIMAP_HEIGHT / CANVAS_SIZE);
    
    const viewportWidth = window.innerWidth - 250;
    const viewportHeight = window.innerHeight - 70;
    
    const newOffsetX = -(clickX / scale - CANVAS_SIZE / 2) * viewState.scale + viewportWidth / 2;
    const newOffsetY = -(clickY / scale - CANVAS_SIZE / 2) * viewState.scale + viewportHeight / 2;
    
    setViewState({
      offsetX: newOffsetX,
      offsetY: newOffsetY,
    });
  };

  return (
    <div 
      ref={containerRef}
      className="minimap"
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
      />
      <span className="minimap-label">导航</span>
    </div>
  );
}

