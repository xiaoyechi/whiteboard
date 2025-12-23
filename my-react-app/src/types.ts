// 新增：模式类型
export type DrawMode = 'draw' | 'erase';

// 新增：单条笔迹（含ID、轨迹、配置）
export interface SingleStroke {
  id: string; // 唯一ID（如uuid）
  points: DrawPoint[]; // 轨迹点
  config: PenConfig; // 笔迹配置（粗细/颜色）
}

// 原有类型保留，新增上述2个类型
export interface DrawPoint {
  x: number;
  y: number;
  time: number;
}

export interface PenConfig {
  lineWidth: number;
  strokeStyle: string;
  lineCap: CanvasLineCap;
}

export interface DrawContext {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
}