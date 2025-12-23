export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  type: 'pen' | 'highlighter';
}

export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasState {
  strokes: Stroke[];
  selectedStrokeIds: string[];
  selectionBox: SelectionBox | null;
}

export interface HistoryRecord {
  id: string;
  name: string;
  thumbnail: string;
  createdAt: number;
  updatedAt: number;
  canvasState: CanvasState;
}

export type ToolType = 'pen' | 'highlighter' | 'eraser' | 'lasso' | 'pan';

export interface ToolSettings {
  penColor: string;
  penWidth: number;
  highlighterColor: string;
  highlighterWidth: number;
  eraserWidth: number;
}

export interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

