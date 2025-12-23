import './ShortcutsHelp.css';

interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { category: '工具', items: [
    { key: 'P / B', desc: '画笔工具' },
    { key: 'H', desc: '荧光笔' },
    { key: 'E', desc: '橡皮擦' },
    { key: 'L / S', desc: '圈选工具' },
    { key: 'V / Space', desc: '移动画布' },
  ]},
  { category: '编辑', items: [
    { key: 'Ctrl + Z', desc: '撤销' },
    { key: 'Ctrl + Y', desc: '重做' },
    { key: 'Ctrl + S', desc: '保存' },
    { key: 'Delete', desc: '删除选中' },
    { key: 'Esc', desc: '取消选择' },
  ]},
  { category: '视图', items: [
    { key: '滚轮', desc: '缩放画布' },
    { key: '拖拽', desc: '平移画布 (移动模式)' },
  ]},
];

export function ShortcutsHelp({ isOpen, onClose }: ShortcutsHelpProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="shortcuts-overlay" onClick={onClose} />
      <div className="shortcuts-modal">
        <div className="shortcuts-header">
          <h2>⌨️ 快捷键</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="shortcuts-content">
          {shortcuts.map((section) => (
            <div key={section.category} className="shortcuts-section">
              <h3>{section.category}</h3>
              <ul>
                {section.items.map((item) => (
                  <li key={item.key}>
                    <kbd>{item.key}</kbd>
                    <span>{item.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="shortcuts-footer">
          <span>按 <kbd>?</kbd> 显示此帮助</span>
        </div>
      </div>
    </>
  );
}

