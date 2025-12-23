import { DrawBoard } from './components/DrawBoard';
import { PenConfig } from './components/PenConfig';
import { useDraw } from './hooks/useDraw'; // 引入 useDraw

function App() {
  // 唯一的 useDraw 实例：状态和方法共享
  const {
    penConfig,
    initCanvas,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    updatePenConfig,
  } = useDraw();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>手写画板</h1>
      {/* 传递配置和修改方法给 PenConfig */}
      <PenConfig penConfig={penConfig} updatePenConfig={updatePenConfig} />
      {/* 传递绘制相关方法给 DrawBoard */}
      <DrawBoard
        initCanvas={initCanvas}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        handleMouseLeave={handleMouseLeave}
      />
    </div>
  );
}

export default App;