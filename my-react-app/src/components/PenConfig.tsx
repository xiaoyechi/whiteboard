// src/components/PenConfig.tsx
import { PenConfig as IPenConfig } from '../types';

// 定义 PenConfig 的 Props 类型
interface PenConfigProps {
  penConfig: IPenConfig;
  updatePenConfig: (config: Partial<IPenConfig>) => void;
}

export const PenConfig = ({ penConfig, updatePenConfig }: PenConfigProps) => {
  // 调整粗细
  const handleLineWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePenConfig({ lineWidth: Number(e.target.value) });
  };

  // 调整颜色
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePenConfig({ strokeStyle: e.target.value });
  };

  return (
    <div style={{ margin: '10px 0 0 20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
      <div>
        <label>笔迹粗细：</label>
        <input
          type="range"
          min="1"
          max="20"
          value={penConfig.lineWidth}
          onChange={handleLineWidthChange}
        />
        <span>{penConfig.lineWidth}px</span>
      </div>
      <div>
        <label>笔迹颜色：</label>
        <input
          type="color"
          value={penConfig.strokeStyle}
          onChange={handleColorChange}
        />
      </div>
    </div>
  );
};