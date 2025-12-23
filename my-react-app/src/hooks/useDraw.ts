import { useState, useRef, useCallback } from 'react';
import { DrawPoint, PenConfig, DrawContext } from '../types';
import { initDrawContext, smoothPoints, drawPath } from '../utils/draw-utils';

export const useDraw = () => {
  // 笔迹配置状态
  const [penConfig, setPenConfig] = useState<PenConfig>({
    lineWidth: 5,
    strokeStyle: '#000000',
    lineCap: 'round',
  });
  // 绘制上下文
  const drawContextRef = useRef<DrawContext>({ canvas: null, ctx: null });
  // 触摸轨迹缓存
  const pointsRef = useRef<DrawPoint[]>([]);
  // 标记是否正在绘制（鼠标按下状态）
  const isDrawingRef = useRef<boolean>(false);

  // 初始化Canvas
  const initCanvas = useCallback((canvas: HTMLCanvasElement) => {
    drawContextRef.current = initDrawContext(canvas);
  }, []);

  // 鼠标按下：开始绘制
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { ctx } = drawContextRef.current;
    if (!ctx) return;
    // 标记为绘制中
    isDrawingRef.current = true;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    // 计算相对Canvas的坐标（鼠标坐标）
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pointsRef.current = [{ x, y, time: Date.now() }];
    // 开始绘制起点
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  // 鼠标移动：绘制轨迹
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    // 仅在鼠标按下时绘制
    if (!isDrawingRef.current) return;
    const { ctx } = drawContextRef.current;
    if (!ctx) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // 缓存轨迹点
    pointsRef.current.push({ x, y, time: Date.now() });
    // 平滑处理后绘制
    const smoothPts = smoothPoints(pointsRef.current);
    // 每次绘制前重新应用配置
    ctx.lineWidth = penConfig.lineWidth;
    ctx.strokeStyle = penConfig.strokeStyle;
    ctx.lineCap = penConfig.lineCap;
    
    drawPath(ctx, smoothPts, penConfig);
  }, [penConfig]);

  // 鼠标松开/移出：结束绘制
  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
    pointsRef.current = [];
  }, []);

  const handleMouseLeave = useCallback(() => {
    // 鼠标移出画布时强制结束绘制（避免异常）
    isDrawingRef.current = false;
    pointsRef.current = [];
  }, []);

  // 修改笔迹配置
  const updatePenConfig = useCallback((config: Partial<PenConfig>) => {
    setPenConfig(prev => ({ ...prev, ...config }));
  }, []);

  return {
    penConfig,
    initCanvas,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    updatePenConfig,
  };
};