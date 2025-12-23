import { useDraw } from '../hooks/useDraw';

export const PenConfig = () => {
  const { penConfig, updatePenConfig } = useDraw();

  // 调整粗细
  const handleLineWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Number(e.target.value);
    console.log(`笔迹粗细调整为: ${newWidth}px`);
    updatePenConfig({ lineWidth: Number(e.target.value) });
  };

  // 调整颜色
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    console.log(`笔迹颜色调整为: ${newColor}`);
    updatePenConfig({ strokeStyle: e.target.value });
  };

  return (
    <div style={{ margin: '10px 0', display: 'flex', gap: '20px', alignItems: 'center' }}>
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