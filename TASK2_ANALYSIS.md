# Task-2: 终端无法输入问题 - 根因分析报告

## 项目信息
- 项目路径: D:\idea\GenericAgent\temp\projects\myDoc-292e17b9\tauri-finder
- 关键文件: src/components/Terminal/TerminalPanel.tsx (360行)
- 终端库: @xterm/xterm + @xterm/addon-fit + @xterm/addon-webgl

## 输入链路分析

### 1. 前端 xterm 初始化 (L116-179)
```typescript
const term = new XtermTerminal({
  cursorBlink: true,
  fontSize: 13,
  fontFamily: 'Consolas, "Cascadia Code", "Fira Code", monospace',
  // ... theme config
});

// 核心输入监听
term.onData((data) => {
  const t = tabRefs.current.find((t) => t.id === tab.id);
  if (t?.child) t.child.write(data);
});
```

### 2. Shell 进程创建 (L73-107)
```typescript
const spawnShell = async (tab: TabState) => {
  const def = useUiStore.getState().defaultShell;
  let prog = def;
  let args: string[] = [];
  
  // 根据 shell 类型配置命令
  if (def === 'cmd') { prog = 'cmd'; args = ['/k']; }
  else if (def === 'powershell') { prog = 'pwsh'; }
  else if (def === 'gitbash') { prog = 'bash'; }
  
  const cmd = Command.create(prog, args, {
    cwd: currentDir,
    encoding: 'raw',
  });
  const child = await cmd.spawn();
};
```

### 3. 命令发送 (L204-211)
```typescript
useEffect(() => {
  if (!terminalCommand) return;
  const active = tabRefs.current.find((t) => t.id === activeTab);
  if (active?.child) {
    active.child.write(terminalCommand + '
');
    clearTerminalCommand();
  }
}, [terminalCommand, activeTab, clearTerminalCommand]);
```

## 发现的潜在问题

### 问题1: display:none 容器焦点失效
- **位置**: L353 `style={{ display: tab.id === activeTab ? 'block' : 'none' }}`
- **影响**: 非活跃 tab 的 xterm 实例处于 display:none 状态
- **后果**: 调用 term.focus() 时，浏览器可能忽略对 display:none 元素的 focus
- **相关代码**: L193-200 的 tab 切换 focus 逻辑

### 问题2: 缺少显式点击聚焦
- **位置**: L347-356 终端容器渲染
- **影响**: 用户点击终端区域时，没有 onClick 事件调用 xterm.focus()
- **现状**: 仅依赖 ResizeObserver (L161-167) 和 window resize (L170) 自动 focus

### 问题3: Tab 切换后焦点恢复延迟不足
- **位置**: L193-200
- **当前**: `setTimeout(..., 50)`
- **建议**: 增加到 100ms 或更长，确保 DOM 完全可见后再 focus

### 问题4: 可能的 CSS pointer-events 问题
- **需要检查**: Terminal.css 中 `.terminal-xterm-instance` 是否有 pointer-events: none
- **当前已知**: Terminal.css 中该类的样式为 L143-146:
  ```css
  .terminal-xterm-instance {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  ```
  此处 display:flex 可能与 L353 的 inline style display:none/block 冲突

## 建议修复方案

### 方案A: 添加点击聚焦 (推荐)
```tsx
// L347-356 修改
<div 
  className="terminal-xterm" 
  style={{ position: 'relative' }}
  onClick={() => {
    const active = tabs.find(t => t.id === activeTab);
    if (active?.xterm) active.xterm.focus();
  }}
>
```

### 方案B: 增加 tab 切换 focus 延迟
```tsx
// L193-200 修改
useEffect(() => {
  setTimeout(() => {
    for (const tab of tabs) {
      try { tab.fitAddon?.fit(); } catch {}
    }
    const active = tabs.find(t => t.id === activeTab);
    if (active?.xterm) active.xterm.focus();
  }, 100); // 从 50 改为 100
}, [tabs, activeTab]);
```

### 方案C: 使用 visibility 替代 display
将 L353 的 `display: none/block` 改为 `visibility: hidden/visible` 或 `opacity: 0/1`，
保持元素在 DOM 中可见但不可见，这样 focus() 仍然有效。

## 待验证
1. 运行应用实际测试终端输入
2. 检查 browser console 是否有 xterm 相关错误
3. 验证 Rust 后端 shell 是否正确 spawn (通过 Tauri devtools)
