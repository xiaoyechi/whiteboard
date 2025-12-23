// src/components/Toolbar.tsx
import { useState } from 'react';
import { PenConfig } from './PenConfig';
import { DrawMode, PenConfig as IPenConfig } from '../types'; // 导入类型

// 定义 Toolbar 的 Props 类型
interface ToolbarProps {
  drawMode: DrawMode;
  switchDrawMode: (mode: DrawMode) => void;
  penConfig: IPenConfig;
  updatePenConfig: (config: Partial<IPenConfig>) => void;
}

export const Toolbar = ({ drawMode, switchDrawMode, penConfig, updatePenConfig }: ToolbarProps) => {
  const [penPanelOpen, setPenPanelOpen] = useState(false);

  return (
    <div style={{ margin: '10px 0' }}>
      {/* 笔迹配置折叠按钮 */}
      <button
        onClick={() => setPenPanelOpen(!penPanelOpen)}
        style={{ marginRight: '10px', padding: '6px 12px' }}
      >
        {penPanelOpen ? '收起笔迹配置' : '笔迹配置'}
      </button>

      {/* 橡皮擦模式切换按钮 */}
      <button
        onClick={() => switchDrawMode(drawMode === 'draw' ? 'erase' : 'draw')}
        style={{
          marginRight: '10px',
          padding: '6px 12px',
          backgroundColor: drawMode === 'erase' ? '#ff4444' : '#fff',
          color: drawMode === 'erase' ? '#fff' : '#000',
        }}
      >
        {drawMode === 'erase' ? '退出擦除' : '橡皮擦'}
      </button>

      {/* 把 Props 转发给 PenConfig */}
      {penPanelOpen && (
        <PenConfig
          penConfig={penConfig}
          updatePenConfig={updatePenConfig}
        />
      )}
    </div>
  );
};