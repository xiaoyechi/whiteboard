import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Stroke, CanvasState, HistoryRecord, ToolType, ToolSettings, ViewState, Point, SelectionBox } from '../types';

interface WhiteboardStore {
  // Canvas State
  canvasState: CanvasState;
  currentStroke: Stroke | null;
  
  // Tool State
  currentTool: ToolType;
  toolSettings: ToolSettings;
  
  // View State
  viewState: ViewState;
  
  // Lasso Selection
  lassoPoints: Point[];
  
  // History Records
  historyRecords: HistoryRecord[];
  currentRecordId: string | null;
  
  // Undo/Redo
  undoStack: CanvasState[];
  redoStack: CanvasState[];
  
  // Actions
  setCurrentTool: (tool: ToolType) => void;
  setToolSettings: (settings: Partial<ToolSettings>) => void;
  
  startStroke: (point: Point) => void;
  addPointToStroke: (point: Point) => void;
  endStroke: () => void;
  
  eraseAtPoint: (point: Point, radius: number) => void;
  
  startLasso: (point: Point) => void;
  addLassoPoint: (point: Point) => void;
  endLasso: () => void;
  
  setSelectionBox: (box: SelectionBox | null) => void;
  moveSelectedStrokes: (dx: number, dy: number) => void;
  deleteSelectedStrokes: () => void;
  clearSelection: () => void;
  
  setViewState: (state: Partial<ViewState>) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  
  undo: () => void;
  redo: () => void;
  
  saveToHistory: (name?: string) => void;
  loadFromHistory: (recordId: string) => void;
  deleteFromHistory: (recordId: string) => void;
  loadHistoryRecords: () => void;
  
  newCanvas: () => void;
  clearCanvas: () => void;
}

const STORAGE_KEY = 'seyou-whiteboard-history';

const defaultCanvasState: CanvasState = {
  strokes: [],
  selectedStrokeIds: [],
  selectionBox: null,
};

const defaultToolSettings: ToolSettings = {
  penColor: '#1a1a2e',
  penWidth: 3,
  highlighterColor: '#ffd93d80',
  highlighterWidth: 20,
  eraserWidth: 20,
};

const defaultViewState: ViewState = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

export const useWhiteboardStore = create<WhiteboardStore>((set, get) => ({
  canvasState: { ...defaultCanvasState },
  currentStroke: null,
  currentTool: 'pen',
  toolSettings: { ...defaultToolSettings },
  viewState: { ...defaultViewState },
  lassoPoints: [],
  historyRecords: [],
  currentRecordId: null,
  undoStack: [],
  redoStack: [],

  setCurrentTool: (tool) => set({ currentTool: tool }),
  
  setToolSettings: (settings) => set((state) => ({
    toolSettings: { ...state.toolSettings, ...settings }
  })),

  startStroke: (point) => {
    const { currentTool, toolSettings } = get();
    if (currentTool !== 'pen' && currentTool !== 'highlighter') return;
    
    const stroke: Stroke = {
      id: uuidv4(),
      points: [point],
      color: currentTool === 'pen' ? toolSettings.penColor : toolSettings.highlighterColor,
      width: currentTool === 'pen' ? toolSettings.penWidth : toolSettings.highlighterWidth,
      type: currentTool,
    };
    
    set({ currentStroke: stroke });
  },

  addPointToStroke: (point) => {
    const { currentStroke } = get();
    if (!currentStroke) return;
    
    set({
      currentStroke: {
        ...currentStroke,
        points: [...currentStroke.points, point],
      }
    });
  },

  endStroke: () => {
    const { currentStroke, canvasState, undoStack } = get();
    if (!currentStroke) return;
    
    // Save current state to undo stack
    const newUndoStack = [...undoStack, { ...canvasState }];
    
    set({
      canvasState: {
        ...canvasState,
        strokes: [...canvasState.strokes, currentStroke],
      },
      currentStroke: null,
      undoStack: newUndoStack.slice(-50), // Keep last 50 states
      redoStack: [],
    });
  },

  eraseAtPoint: (point, radius) => {
    const { canvasState, undoStack, viewState } = get();
    const { scale, offsetX, offsetY } = viewState;
    
    // Transform point to canvas coordinates
    const canvasPoint = {
      x: (point.x - offsetX) / scale,
      y: (point.y - offsetY) / scale,
    };
    const canvasRadius = radius / scale;
    
    let modified = false;
    const newStrokes: Stroke[] = [];
    
    // 优化：使用边界框快速筛选，只处理可能与橡皮擦相交的笔触
    for (const stroke of canvasState.strokes) {
      // 快速筛选：先检查边界框是否与圆形相交
      const strokeBbox = getStrokeBoundingBox(stroke);
      
      if (!isBoundingBoxIntersectingCircle(strokeBbox, canvasPoint, canvasRadius)) {
        // 边界框不相交，笔触肯定不会被擦除，直接保留
        newStrokes.push(stroke);
        continue;
      }
      
      // 边界框相交，进行详细的切割判断
      const splitResult = splitStrokeAtPoint(stroke, canvasPoint, canvasRadius);
      
      if (splitResult.length === 1 && splitResult[0].id === stroke.id) {
        // Stroke wasn't affected
        newStrokes.push(stroke);
      } else {
        // Stroke was split or erased
        modified = true;
        newStrokes.push(...splitResult.filter(s => s.points.length > 1));
      }
    }
    
    if (modified) {
      const newUndoStack = [...undoStack, { ...canvasState }];
      set({
        canvasState: {
          ...canvasState,
          strokes: newStrokes,
        },
        undoStack: newUndoStack.slice(-50),
        redoStack: [],
      });
    }
  },

  startLasso: (point) => {
    set({ lassoPoints: [point] });
  },

  addLassoPoint: (point) => {
    const { lassoPoints } = get();
    set({ lassoPoints: [...lassoPoints, point] });
  },

  endLasso: () => {
    const { lassoPoints, canvasState, viewState } = get();
    if (lassoPoints.length < 3) {
      set({ lassoPoints: [] });
      return;
    }
    
    const { scale, offsetX, offsetY } = viewState;
    
    // Transform lasso points to canvas coordinates
    const canvasLassoPoints = lassoPoints.map(p => ({
      x: (p.x - offsetX) / scale,
      y: (p.y - offsetY) / scale,
    }));
    
    // 优化：先计算套索的边界框
    const lassoBbox = getPolygonBoundingBox(canvasLassoPoints);
    
    // Find strokes inside the lasso
    const selectedIds: string[] = [];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    // 优化：使用边界框快速筛选，只处理可能与套索相交的笔触
    for (const stroke of canvasState.strokes) {
      // 快速筛选：先检查边界框是否与套索边界框相交
      const strokeBbox = getStrokeBoundingBox(stroke);
      
      if (!isBoundingBoxIntersecting(strokeBbox, lassoBbox)) {
        // 边界框不相交，笔触肯定不在套索内，跳过
        continue;
      }
      
      // 边界框相交，进行详细的多边形包含判断
      if (isStrokeInsideLasso(stroke, canvasLassoPoints)) {
        selectedIds.push(stroke.id);
        
        // Calculate bounding box（使用已计算的边界框，避免重复遍历点）
        minX = Math.min(minX, strokeBbox.minX);
        minY = Math.min(minY, strokeBbox.minY);
        maxX = Math.max(maxX, strokeBbox.maxX);
        maxY = Math.max(maxY, strokeBbox.maxY);
      }
    }
    
    const selectionBox = selectedIds.length > 0 ? {
      x: minX - 10,
      y: minY - 10,
      width: maxX - minX + 20,
      height: maxY - minY + 20,
    } : null;
    
    set({
      lassoPoints: [],
      canvasState: {
        ...canvasState,
        selectedStrokeIds: selectedIds,
        selectionBox,
      },
    });
  },

  setSelectionBox: (box) => {
    const { canvasState } = get();
    set({
      canvasState: {
        ...canvasState,
        selectionBox: box,
      }
    });
  },

  moveSelectedStrokes: (dx, dy) => {
    const { canvasState, viewState } = get();
    const { scale } = viewState;
    const { selectedStrokeIds, selectionBox } = canvasState;
    
    if (selectedStrokeIds.length === 0) return;
    
    // 优化：使用 Set 进行 O(1) 查找，而不是 O(n) 的 includes
    const selectedIdsSet = new Set(selectedStrokeIds);
    
    const scaledDx = dx / scale;
    const scaledDy = dy / scale;
    
    const newStrokes = canvasState.strokes.map(stroke => {
      if (selectedIdsSet.has(stroke.id)) {
        return {
          ...stroke,
          points: stroke.points.map(p => ({
            ...p,
            x: p.x + scaledDx,
            y: p.y + scaledDy,
          })),
        };
      }
      return stroke;
    });
    
    set({
      canvasState: {
        ...canvasState,
        strokes: newStrokes,
        selectionBox: selectionBox ? {
          ...selectionBox,
          x: selectionBox.x + scaledDx,
          y: selectionBox.y + scaledDy,
        } : null,
      },
    });
  },

  deleteSelectedStrokes: () => {
    const { canvasState, undoStack } = get();
    const { selectedStrokeIds } = canvasState;
    
    if (selectedStrokeIds.length === 0) return;
    
    // 优化：使用 Set 进行 O(1) 查找，而不是 O(n) 的 includes
    const selectedIdsSet = new Set(selectedStrokeIds);
    
    const newUndoStack = [...undoStack, { ...canvasState }];
    
    set({
      canvasState: {
        ...canvasState,
        strokes: canvasState.strokes.filter(s => !selectedIdsSet.has(s.id)),
        selectedStrokeIds: [],
        selectionBox: null,
      },
      undoStack: newUndoStack.slice(-50),
      redoStack: [],
    });
  },

  clearSelection: () => {
    const { canvasState } = get();
    set({
      canvasState: {
        ...canvasState,
        selectedStrokeIds: [],
        selectionBox: null,
      },
      lassoPoints: [],
    });
  },

  setViewState: (state) => set((prev) => ({
    viewState: { ...prev.viewState, ...state }
  })),

  zoomIn: () => {
    const { viewState } = get();
    const newScale = Math.min(viewState.scale * 1.2, 5);
    set({ viewState: { ...viewState, scale: newScale } });
  },

  zoomOut: () => {
    const { viewState } = get();
    const newScale = Math.max(viewState.scale / 1.2, 0.1);
    set({ viewState: { ...viewState, scale: newScale } });
  },

  resetZoom: () => {
    set({ viewState: { ...defaultViewState } });
  },

  undo: () => {
    const { undoStack, canvasState, redoStack } = get();
    if (undoStack.length === 0) return;
    
    const previousState = undoStack[undoStack.length - 1];
    set({
      canvasState: previousState,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, canvasState],
    });
  },

  redo: () => {
    const { redoStack, canvasState, undoStack } = get();
    if (redoStack.length === 0) return;
    
    const nextState = redoStack[redoStack.length - 1];
    set({
      canvasState: nextState,
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, canvasState],
    });
  },

  saveToHistory: (name) => {
    const { canvasState, historyRecords, currentRecordId } = get();
    const now = Date.now();
    
    // Generate thumbnail (will be set by canvas component)
    const record: HistoryRecord = {
      id: currentRecordId || uuidv4(),
      name: name || `画布 ${new Date().toLocaleString('zh-CN')}`,
      thumbnail: '',
      createdAt: currentRecordId ? 
        (historyRecords.find(r => r.id === currentRecordId)?.createdAt || now) : now,
      updatedAt: now,
      canvasState: JSON.parse(JSON.stringify(canvasState)),
    };
    
    const existingIndex = historyRecords.findIndex(r => r.id === record.id);
    let newRecords: HistoryRecord[];
    
    if (existingIndex >= 0) {
      newRecords = [...historyRecords];
      newRecords[existingIndex] = record;
    } else {
      newRecords = [record, ...historyRecords];
    }
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
    
    set({
      historyRecords: newRecords,
      currentRecordId: record.id,
    });
  },

  loadFromHistory: (recordId) => {
    const { historyRecords } = get();
    const record = historyRecords.find(r => r.id === recordId);
    
    if (record) {
      set({
        canvasState: JSON.parse(JSON.stringify(record.canvasState)),
        currentRecordId: record.id,
        undoStack: [],
        redoStack: [],
        viewState: { ...defaultViewState },
      });
    }
  },

  deleteFromHistory: (recordId) => {
    const { historyRecords, currentRecordId } = get();
    const newRecords = historyRecords.filter(r => r.id !== recordId);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
    
    set({
      historyRecords: newRecords,
      currentRecordId: currentRecordId === recordId ? null : currentRecordId,
    });
  },

  loadHistoryRecords: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const records = JSON.parse(stored) as HistoryRecord[];
        set({ historyRecords: records });
      }
    } catch (e) {
      console.error('Failed to load history records:', e);
    }
  },

  newCanvas: () => {
    set({
      canvasState: { ...defaultCanvasState, strokes: [] },
      currentRecordId: null,
      undoStack: [],
      redoStack: [],
      viewState: { ...defaultViewState },
    });
  },

  clearCanvas: () => {
    const { canvasState, undoStack } = get();
    const newUndoStack = [...undoStack, { ...canvasState }];
    
    set({
      canvasState: { ...defaultCanvasState, strokes: [] },
      undoStack: newUndoStack.slice(-50),
      redoStack: [],
    });
  },
}));

// ==================== 优化辅助函数 ====================

// 计算笔触的边界框（Bounding Box）
interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function getStrokeBoundingBox(stroke: Stroke): BoundingBox {
  if (stroke.points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  for (const point of stroke.points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  
  // 考虑笔触宽度，扩展边界框
  const padding = stroke.width / 2;
  
  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
  };
}

// 判断边界框是否与圆形相交（用于橡皮擦优化）
function isBoundingBoxIntersectingCircle(bbox: BoundingBox, center: Point, radius: number): boolean {
  // 找到边界框上距离圆心最近的点
  const closestX = Math.max(bbox.minX, Math.min(center.x, bbox.maxX));
  const closestY = Math.max(bbox.minY, Math.min(center.y, bbox.maxY));
  
  // 计算最近点到圆心的距离
  const dx = center.x - closestX;
  const dy = center.y - closestY;
  const distanceSquared = dx * dx + dy * dy;
  
  return distanceSquared <= radius * radius;
}

// 计算多边形的边界框（用于套索优化）
function getPolygonBoundingBox(points: Point[]): BoundingBox {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  
  return { minX, minY, maxX, maxY };
}

// 判断两个边界框是否相交（用于套索优化）
function isBoundingBoxIntersecting(bbox1: BoundingBox, bbox2: BoundingBox): boolean {
  return !(
    bbox1.maxX < bbox2.minX ||
    bbox1.minX > bbox2.maxX ||
    bbox1.maxY < bbox2.minY ||
    bbox1.minY > bbox2.maxY
  );
}

// ==================== 原有辅助函数 ====================

// Helper function: Split stroke at eraser point
function splitStrokeAtPoint(stroke: Stroke, point: Point, radius: number): Stroke[] {
  const segments: Point[][] = [];
  let currentSegment: Point[] = [];
  
  for (let i = 0; i < stroke.points.length; i++) {
    const p = stroke.points[i];
    const distance = Math.sqrt(Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2));
    
    if (distance > radius) {
      currentSegment.push(p);
    } else {
      if (currentSegment.length > 1) {
        segments.push(currentSegment);
      }
      currentSegment = [];
    }
  }
  
  if (currentSegment.length > 1) {
    segments.push(currentSegment);
  }
  
  if (segments.length === 0) {
    return [];
  }
  
  if (segments.length === 1 && segments[0].length === stroke.points.length) {
    return [stroke];
  }
  
  return segments.map(points => ({
    ...stroke,
    id: uuidv4(),
    points,
  }));
}

// Helper function: Check if stroke is inside lasso
function isStrokeInsideLasso(stroke: Stroke, lassoPoints: Point[]): boolean {
  // Check if any point of the stroke is inside the lasso polygon
  for (const point of stroke.points) {
    if (isPointInPolygon(point, lassoPoints)) {
      return true;
    }
  }
  return false;
}

// Helper function: Point in polygon test (ray casting)
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const n = polygon.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

