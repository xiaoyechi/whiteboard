// src/App.tsx
import { DrawBoard } from './components/DrawBoard';
import { Toolbar } from './components/Toolbar';
import { useDraw } from './hooks/useDraw'; // 唯一的 useDraw 实例

function App() {
  // 唯一的 useDraw 调用：所有状态/方法都来自这里
  const drawHook = useDraw();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>手写画板</h1>
      {/* 给 Toolbar 传递需要的状态/方法 */}
      <Toolbar
        drawMode={drawHook.drawMode}
        switchDrawMode={drawHook.switchDrawMode}
        penConfig={drawHook.penConfig}
        updatePenConfig={drawHook.updatePenConfig}
      />
      {/* 给 DrawBoard 传递需要的状态/方法 */}
      <DrawBoard
        initCanvas={drawHook.initCanvas}
        drawMode={drawHook.drawMode}
        handleMouseDown={drawHook.handleMouseDown}
        handleMouseMove={drawHook.handleMouseMove}
        handleMouseUp={drawHook.handleMouseUp}
        handleMouseLeave={drawHook.handleMouseLeave}
      />
    </div>
  );
}

export default App;