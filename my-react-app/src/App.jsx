import { DrawBoard } from './components/DrawBoard';
import { PenConfig } from './components/PenConfig';

function App() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>手写画板</h1>
      <PenConfig />
      <DrawBoard />
    </div>
  );
}

export default App;