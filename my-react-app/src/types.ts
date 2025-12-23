// 单个笔迹点的结构
export interface DrawPoint {
  x: number; // 横坐标
  y: number; // 纵坐标
  time: number; // 时间戳（用于平滑处理）
}

// 笔迹配置
export interface PenConfig {
  lineWidth: number; // 粗细（px）
  strokeStyle: string; // 颜色（十六进制/rgb）
  lineCap: CanvasLineCap; // 笔触圆角（保证平滑）
}

// 绘制上下文（封装Canvas相关）
export interface DrawContext {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
}