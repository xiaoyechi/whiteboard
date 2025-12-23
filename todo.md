组件 (src/components/)
action-bar/ - 工具栏组件，包含绘图工具选择
control-panel/ - 控制面板，包含撤销/重做、缩放等功能
info/ - 信息对话框组件
工具函数 (src/utilities/)
adjust-element-coordinates.ts - 调整元素坐标
adjustment-required.ts - 判断是否需要调整
create-element.ts - 创建新元素
cursor-for-position.ts - 根据位置设置鼠标样式
draw-element.ts - 绘制元素
get-element-at-position.ts - 获取指定位置的元素
near-point/ - 点位判断相关功能
resized-coordinates/ - 调整大小时的坐标计算
自定义Hooks (src/hooks/)
useHistory.ts - 历史记录管理
usePressedKeys.ts - 键盘按键状态管理
