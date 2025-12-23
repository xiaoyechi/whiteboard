import { useRef, useEffect, useCallback, useState } from 'react';
import { useWhiteboardStore } from '../store/useWhiteboardStore';
import type { Point } from '../types';
import './Canvas.css';

// Catmull-Rom spline for smooth curves
function getCatmullRomPoint(
  p0: Point, p1: Point, p2: Point, p3: Point, t: number
): Point {
  const t2 = t * t;
  const t3 = t2 * t;
  
  return {
    x: 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    ),
    y: 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    ),
  };
}

function drawSmoothStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  width: number,
  isHighlighter: boolean = false
) {
  if (points.length < 2) return;
  
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  if (isHighlighter) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.5;
  }
  
  ctx.beginPath();
  
  if (points.length === 2) {
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
  } else {
    // Use Catmull-Rom spline for smooth curves
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[Math.min(points.length - 1, i + 1)];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      
      // Draw segments along the spline
      const segments = 8;
      for (let j = 1; j <= segments; j++) {
        const t = j / segments;
        const pt = getCatmullRomPoint(p0, p1, p2, p3, t);
        ctx.lineTo(pt.x, pt.y);
      }
    }
  }
  
  ctx.stroke();
  ctx.restore();
}

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isMovingSelection, setIsMovingSelection] = useState(false);
  const lastPanPoint = useRef<Point | null>(null);
  const lastMovePoint = useRef<Point | null>(null);
  
  const {
    canvasState,
    currentStroke,
    currentTool,
    toolSettings,
    viewState,
    lassoPoints,
    startStroke,
    addPointToStroke,
    endStroke,
    eraseAtPoint,
    startLasso,
    addLassoPoint,
    endLasso,
    moveSelectedStrokes,
    clearSelection,
    setViewState,
  } = useWhiteboardStore();

  // Get canvas point from mouse event
  const getCanvasPoint = useCallback((e: React.MouseEvent | MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Get point in canvas coordinate space (accounting for pan/zoom)
  const getTransformedPoint = useCallback((screenPoint: Point): Point => {
    const { scale, offsetX, offsetY } = viewState;
    return {
      x: (screenPoint.x - offsetX) / scale,
      y: (screenPoint.y - offsetY) / scale,
    };
  }, [viewState]);

  // Check if point is inside selection box
  const isPointInSelectionBox = useCallback((screenPoint: Point): boolean => {
    const { selectionBox } = canvasState;
    if (!selectionBox) return false;
    
    const { scale, offsetX, offsetY } = viewState;
    const screenBox = {
      x: selectionBox.x * scale + offsetX,
      y: selectionBox.y * scale + offsetY,
      width: selectionBox.width * scale,
      height: selectionBox.height * scale,
    };
    
    return (
      screenPoint.x >= screenBox.x &&
      screenPoint.x <= screenBox.x + screenBox.width &&
      screenPoint.y >= screenBox.y &&
      screenPoint.y <= screenBox.y + screenBox.height
    );
  }, [canvasState.selectionBox, viewState]);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const point = getCanvasPoint(e);
    const transformedPoint = getTransformedPoint(point);
    
    // Check if clicking on selection box
    if (canvasState.selectionBox && isPointInSelectionBox(point)) {
      setIsMovingSelection(true);
      lastMovePoint.current = point;
      return;
    }
    
    // Clear selection when starting a new action
    if (canvasState.selectedStrokeIds.length > 0) {
      clearSelection();
    }
    
    switch (currentTool) {
      case 'pen':
      case 'highlighter':
        setIsDrawing(true);
        startStroke(transformedPoint);
        break;
      case 'eraser':
        setIsDrawing(true);
        eraseAtPoint(point, toolSettings.eraserWidth);
        break;
      case 'lasso':
        setIsDrawing(true);
        startLasso(point);
        break;
      case 'pan':
        setIsPanning(true);
        lastPanPoint.current = point;
        break;
    }
  }, [currentTool, getCanvasPoint, getTransformedPoint, startStroke, eraseAtPoint, startLasso, toolSettings.eraserWidth, canvasState.selectionBox, canvasState.selectedStrokeIds.length, isPointInSelectionBox, clearSelection]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const point = getCanvasPoint(e);
    const transformedPoint = getTransformedPoint(point);
    
    if (isMovingSelection && lastMovePoint.current) {
      const dx = point.x - lastMovePoint.current.x;
      const dy = point.y - lastMovePoint.current.y;
      moveSelectedStrokes(dx, dy);
      lastMovePoint.current = point;
      return;
    }
    
    if (!isDrawing && !isPanning) return;
    
    switch (currentTool) {
      case 'pen':
      case 'highlighter':
        addPointToStroke(transformedPoint);
        break;
      case 'eraser':
        eraseAtPoint(point, toolSettings.eraserWidth);
        break;
      case 'lasso':
        addLassoPoint(point);
        break;
      case 'pan':
        if (lastPanPoint.current) {
          const dx = point.x - lastPanPoint.current.x;
          const dy = point.y - lastPanPoint.current.y;
          setViewState({
            offsetX: viewState.offsetX + dx,
            offsetY: viewState.offsetY + dy,
          });
          lastPanPoint.current = point;
        }
        break;
    }
  }, [isDrawing, isPanning, isMovingSelection, currentTool, getCanvasPoint, getTransformedPoint, addPointToStroke, eraseAtPoint, addLassoPoint, setViewState, viewState.offsetX, viewState.offsetY, toolSettings.eraserWidth, moveSelectedStrokes]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isMovingSelection) {
      setIsMovingSelection(false);
      lastMovePoint.current = null;
      return;
    }
    
    if (!isDrawing && !isPanning) return;
    
    switch (currentTool) {
      case 'pen':
      case 'highlighter':
        endStroke();
        break;
      case 'lasso':
        endLasso();
        break;
    }
    
    setIsDrawing(false);
    setIsPanning(false);
    lastPanPoint.current = null;
  }, [isDrawing, isPanning, isMovingSelection, currentTool, endStroke, endLasso]);

  // Handle wheel for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const point = getCanvasPoint(e);
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(viewState.scale * delta, 0.1), 5);
    
    // Zoom towards cursor position
    const scaleRatio = newScale / viewState.scale;
    const newOffsetX = point.x - (point.x - viewState.offsetX) * scaleRatio;
    const newOffsetY = point.y - (point.y - viewState.offsetY) * scaleRatio;
    
    setViewState({
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
    });
  }, [viewState, getCanvasPoint, setViewState]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const resizeObserver = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    });
    
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid background
    ctx.save();
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 0.5;
    
    const gridSize = 20 * viewState.scale;
    const offsetX = viewState.offsetX % gridSize;
    const offsetY = viewState.offsetY % gridSize;
    
    for (let x = offsetX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
    
    // Apply view transform
    ctx.save();
    ctx.translate(viewState.offsetX, viewState.offsetY);
    ctx.scale(viewState.scale, viewState.scale);
    
    // Draw all strokes
    for (const stroke of canvasState.strokes) {
      const isSelected = canvasState.selectedStrokeIds.includes(stroke.id);
      
      if (isSelected) {
        // Draw glow effect for selected strokes
        ctx.save();
        ctx.shadowColor = '#6366f1';
        ctx.shadowBlur = 8;
        drawSmoothStroke(ctx, stroke.points, stroke.color, stroke.width, stroke.type === 'highlighter');
        ctx.restore();
      }
      
      drawSmoothStroke(ctx, stroke.points, stroke.color, stroke.width, stroke.type === 'highlighter');
    }
    
    // Draw current stroke
    if (currentStroke) {
      drawSmoothStroke(
        ctx,
        currentStroke.points,
        currentStroke.color,
        currentStroke.width,
        currentStroke.type === 'highlighter'
      );
    }
    
    // Draw selection box
    if (canvasState.selectionBox) {
      const box = canvasState.selectionBox;
      ctx.save();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2 / viewState.scale;
      ctx.setLineDash([5 / viewState.scale, 5 / viewState.scale]);
      ctx.strokeRect(box.x, box.y, box.width, box.height);
      
      // Draw corner handles
      ctx.fillStyle = '#6366f1';
      const handleSize = 8 / viewState.scale;
      const corners = [
        { x: box.x, y: box.y },
        { x: box.x + box.width, y: box.y },
        { x: box.x, y: box.y + box.height },
        { x: box.x + box.width, y: box.y + box.height },
      ];
      
      for (const corner of corners) {
        ctx.fillRect(
          corner.x - handleSize / 2,
          corner.y - handleSize / 2,
          handleSize,
          handleSize
        );
      }
      ctx.restore();
    }
    
    ctx.restore();
    
    // Draw lasso path (in screen coordinates)
    if (lassoPoints.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      
      ctx.beginPath();
      ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
      for (let i = 1; i < lassoPoints.length; i++) {
        ctx.lineTo(lassoPoints[i].x, lassoPoints[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
    
    // Draw eraser cursor preview
    if (currentTool === 'eraser') {
      // Will be handled by CSS custom cursor
    }
    
  }, [canvasState, currentStroke, viewState, lassoPoints, currentTool]);

  // Get cursor style
  const getCursorStyle = () => {
    switch (currentTool) {
      case 'pan':
        return isPanning ? 'grabbing' : 'grab';
      case 'eraser':
        return 'none';
      case 'lasso':
        return 'crosshair';
      default:
        return 'crosshair';
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="canvas-container"
      style={{ cursor: getCursorStyle() }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      {currentTool === 'eraser' && (
        <div 
          className="eraser-cursor"
          style={{
            width: toolSettings.eraserWidth * 2,
            height: toolSettings.eraserWidth * 2,
          }}
        />
      )}
    </div>
  );
}

