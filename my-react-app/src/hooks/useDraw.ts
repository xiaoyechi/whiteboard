import { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // 需安装：npm i uuid @types/uuid
import { DrawPoint, PenConfig, DrawContext, DrawMode, SingleStroke } from '../types';
import { initDrawContext, smoothPoints, drawPath } from '../utils/draw-utils';
import { isPointInStroke, redrawAllStrokes } from '../utils/erase-utils';

export const useDraw = () => {
  // 原有配置状态
  const [penConfig, setPenConfig] = useState<PenConfig>({
    lineWidth: 5,
    strokeStyle: '#000000',
    lineCap: 'round',
  });
  // 新增：模式状态（默认绘制）
  const [drawMode, setDrawMode] = useState<DrawMode>('draw');
  // 新增：笔迹历史（存储所有绘制的笔迹）
  const strokesRef = useRef<SingleStroke[]>([]);
  // 原有引用
  const drawContextRef = useRef<DrawContext>({ canvas: null, ctx: null });
  const pointsRef = useRef<DrawPoint[]>([]);
  const isDrawingRef = useRef<boolean>(false);

  // 初始化Canvas
  const initCanvas = useCallback((canvas: HTMLCanvasElement) => {
    drawContextRef.current = initDrawContext(canvas);
  }, []);

  // 新增：切换模式
  const switchDrawMode = useCallback((mode: DrawMode) => {
    setDrawMode(mode);
    isDrawingRef.current = false; // 切换模式时停止绘制/擦除
    pointsRef.current = [];
  }, []);

  // 鼠标按下：区分绘制/擦除模式
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { ctx } = drawContextRef.current;
    if (!ctx) return;

    isDrawingRef.current = true;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pointsRef.current = [{ x, y, time: Date.now() }];

    // 绘制模式：初始化新笔迹起点
    if (drawMode === 'draw') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  }, [drawMode]);

  // 鼠标移动：区分绘制/擦除逻辑
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;

    const { ctx } = drawContextRef.current;
    if (!ctx) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 1. 绘制模式：新增轨迹并实时绘制
    if (drawMode === 'draw') {
      pointsRef.current.push({ x, y, time: Date.now() });
      const smoothPts = smoothPoints(pointsRef.current);
      drawPath(ctx, smoothPts, penConfig);
    }

    // 2. 擦除模式：检测碰撞并移除笔迹
    if (drawMode === 'erase') {
      // 找到包含当前坐标的笔迹ID
      const strokeToRemove = strokesRef.current.find((stroke) =>
        isPointInStroke(x, y, stroke)
      );
      if (strokeToRemove) {
        // 过滤掉要擦除的笔迹
        strokesRef.current = strokesRef.current.filter(
          (s) => s.id !== strokeToRemove.id
        );
        // 重绘所有剩余笔迹
        redrawAllStrokes(ctx, strokesRef.current);
      }
    }
  }, [drawMode, penConfig]);

  // 鼠标松开：绘制模式下保存笔迹到历史
  const handleMouseUp = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    // 绘制模式：保存当前轨迹为一条新笔迹
    if (drawMode === 'draw' && pointsRef.current.length > 1) {
      const newStroke: SingleStroke = {
        id: uuidv4(),
        points: [...pointsRef.current],
        config: { ...penConfig },
      };
      strokesRef.current.push(newStroke);
    }

    pointsRef.current = [];
  }, [drawMode, penConfig]);

  // 鼠标移出：重置状态
  const handleMouseLeave = useCallback(() => {
    isDrawingRef.current = false;
    pointsRef.current = [];
  }, []);

  // 原有：更新笔迹配置
  const updatePenConfig = useCallback((config: Partial<PenConfig>) => {
    setPenConfig((prev) => ({ ...prev, ...config }));
  }, []);

  return {
    penConfig,
    drawMode, // 暴露模式状态
    initCanvas,
    switchDrawMode, // 暴露模式切换方法
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    updatePenConfig,
  };
};