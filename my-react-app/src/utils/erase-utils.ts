import { DrawPoint, SingleStroke } from '../types';

// 碰撞检测：判断鼠标坐标是否在某条笔迹的轨迹范围内（容差：笔宽的1.5倍，提升擦除体验）
export const isPointInStroke = (
  x: number,
  y: number,
  stroke: SingleStroke,
  tolerance = 1.5
): boolean => {
  const { points, config } = stroke;
  const threshold = config.lineWidth * tolerance;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    // 计算点到线段的距离（简化版：适合手写轨迹）
    const dist = pointToLineDistance(x, y, p1.x, p1.y, p2.x, p2.y);
    if (dist < threshold) return true;
  }
  return false;
};

// 辅助：计算点到线段的垂直距离
const pointToLineDistance = (
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => {
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  if (lenSq === 0) return Math.hypot(A, B); // 线段为点
  const param = dot / lenSq;
  let xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  return Math.hypot(x - xx, y - yy);
};

// 重绘所有未被擦除的笔迹
export const redrawAllStrokes = (
  ctx: CanvasRenderingContext2D,
  strokes: SingleStroke[]
): void => {
  // 清空Canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  // 逐笔重绘
  strokes.forEach((stroke) => {
    if (stroke.points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    stroke.points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineWidth = stroke.config.lineWidth;
    ctx.strokeStyle = stroke.config.strokeStyle;
    ctx.lineCap = stroke.config.lineCap;
    ctx.stroke();
  });
};