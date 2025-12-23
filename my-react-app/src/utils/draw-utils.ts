import { DrawPoint, PenConfig, DrawContext } from '../types';

// 轨迹平滑：贝塞尔曲线插值（解决触摸轨迹卡顿）
export const smoothPoints = (points: DrawPoint[]): DrawPoint[] => {
  if (points.length < 3) return points;
  const smoothPoints: DrawPoint[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    // 计算中点，生成平滑轨迹
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    smoothPoints.push({ x: (p0.x + midX) / 2, y: (p0.y + midY) / 2, time: p1.time });
  }
  smoothPoints.push(points[points.length - 1]);
  return smoothPoints;
};

// 初始化Canvas上下文
export const initDrawContext = (canvas: HTMLCanvasElement): DrawContext => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas上下文创建失败');
  // 适配高清屏（避免模糊）
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.scale(dpr, dpr);
  return { canvas, ctx };
};

// 绘制单段轨迹
export const drawPath = (ctx: CanvasRenderingContext2D, points: DrawPoint[], config: PenConfig) => {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  // 绘制平滑路径
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  // 应用笔迹配置
  ctx.lineWidth = config.lineWidth;
  ctx.strokeStyle = config.strokeStyle;
  ctx.lineCap = config.lineCap;
  ctx.stroke();
};