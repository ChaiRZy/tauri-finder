# tauri-finder 插件开发手册

> 文件位置：`src/plugins/DEV_HANDBOOK.md`
> 适用版本：tauri-finder v0.1+

---

## 一、插件系统概述

当前插件系统基于**静态注册 + 三栏布局**，支持三个固定位置：

| 位置 | 特性 | 典型用途 |
|------|------|----------|
| `left` | 单个可见（activeTab 切换） | 文件树 |
| `right` | 单个可见（activeTab 切换） | 预览、工具面板 |
| `bottom` | 多个水平并排 | 终端、日志、任务 |

### 核心文件结构

```
src/plugins/
├── types.ts              # 类型定义（PluginDefinition、PluginMcpTool 等）
├── registry.ts           # 注册中心（registerPlugin / getAllPlugins）
├── pluginStore.ts        # 运行时状态（Zustand：显隐/尺寸/禁用/activeTab）
├── eventBus.ts           # 事件总线（插件间通信）
├── index.ts              # 注册所有内置插件
├── DEV_HANDBOOK.md       # ← 本文档
│
├── <PluginName>/         # 每个插件自己的目录
│   ├── index.tsx         # 插件组件（必需）
│   └── ...               # 其他辅助文件
```

---

## 二、加一个新插件的最少步骤

### 2.1 创建插件组件

```
// src/plugins/MyPlugin/index.tsx
export default function MyPlugin() {
  return <div>Hello from MyPlugin</div>;
}
```

### 2.2 注册

```typescript
// src/plugins/index.ts
import MyPlugin from './MyPlugin';

registerPlugin({
  id: 'my-plugin',
  title: 'My Plugin',
  component: MyPlugin,
  position: 'right',
  defaultSize: 300,
  minSize: 200,
  maxSize: 600,
  defaultVisible: false,
});
```

无需修改 AppLayout、Toolbar、ContextMenu。

### 2.3 可选：贡献点

| 贡献点 | 注册字段 | 自动出现位置 |
|--------|----------|------------|
| 工具栏按钮 | `toolbarActions[]` | Toolbar 上 |
| 右键菜单 | `contextMenuItems[]` | 文件/空白处右键 |
| 生命周期 | `onActivate / onDeactivate / onResize` | 插件显隐/尺寸变化时 |

---

## 三、PluginDefinition 完整字段

```typescript
interface PluginDefinition {
  // ── 基本（必需） ──
  id: string;                  // 唯一标识，如 'my-plugin'
  title: string;               // 显示标题
  component: ComponentType;    // React 组件
  position: 'left' | 'right' | 'bottom';

  // ── 尺寸（可选，有默认值） ──
  defaultSize?: number;        // 默认宽/高（px）
  minSize?: number;            // 最小宽/高（px）
  maxSize?: number;            // 最大宽/高（px）
  defaultVisible?: boolean;    // 启动时是否显示

  // ── MCP 能力声明（可选） ──
  summary?: string;            // 简短描述
  mcpTools?: PluginMcpTool[];  // 该插件暴露的 MCP 工具

  // ── 生命周期（可选） ──
  onActivate?: () => void;
  onDeactivate?: () => void;
  onResize?: (size: number) => void;

  // ── 贡献点（可选） ──
  toolbarActions?: PluginToolbarAction[];
  contextMenuItems?: PluginContextMenuItem[];
}
```

---

## 四、MCP 能力声明

每个插件可以声明其暴露给 AI 助手的 MCP 工具：

```typescript
// 在 registerPlugin 中添加
registerPlugin({
  id: 'my-plugin',
  // ...
  mcpTools: [{
    name: 'my_tool',                    // 工具名称，全局唯一
    description: '描述工具的用途',       // LLM 理解用
    command: 'my_tool_command',          // 对应的 Tauri command
    inputSchema: {                       // JSON Schema
      type: 'object',
      properties: {
        param1: { type: 'string', description: '参数说明' },
      },
      required: ['param1'],
    },
  }],
});
```

声明后，该工具会：
1. 显示在插件管理面板的 MCP 标签中
2. 可通过 `mcp_list_tools` 查询
3. AI 助手插件可通过 tool calling 自动调用

### 现有插件的 MCP 工具清单

| 插件 | MCP 工具数 | 主要工具 |
|------|-----------|---------|
| 文件 (FileExplorer) | 3 | `list_directory`, `get_system_dirs`, `get_drives` |
| 预览 (PreviewPlugin) | 3 | `read_text_file`, `read_file_bytes`, `highlight_file` |
| Diff 对比 (DiffViewer) | 1 | `diff_files` |
| Markdown Preview | 1 | `render_markdown` |
| Git Status | 1 | `get_git_status` |
| AI 助手 | 1 | `ai_ask` |
| 命令行 / 输出 / 任务 / Theme | 0 | 无 MCP 工具 |

---

## 五、插件与后端通信

插件通过 `@tauri-apps/api/core` 的 `invoke` 调用 Rust 命令：

```typescript
import { invoke } from '@tauri-apps/api/core';

// 调用同步 Rust 命令
const files = await invoke('list_directory', { path: '/home/user' });

// 调用 AI 助手命令
const reply = await invoke('ai_ask', {
  prompt: '列出当前目录下的所有文件',
  currentDir: '/home/user',
});
```

### 后端也支持 MCP 协议

Rust 端 `commands/mcp/mod.rs` 维护完整的 MCP 工具注册表：

```rust
// 返回所有可用工具
#[tauri::command]
pub fn mcp_list_tools() -> Vec<McpToolDef> { ... }

// 统一工具调用入口
#[tauri::command]
pub async fn mcp_call_tool(name: String, arguments: HashMap<String, Value>) -> Result<McpToolResult, String> { ... }
```

---

## 六、插件开关与禁用

每个插件可以通过**插件管理面板**（PluginManager）启用或禁用：

| 操作 | Store 方法 | 效果 |
|------|-----------|------|
| 禁用 | `setPluginDisabled(id, true)` | 自动隐藏，从布局中移除 |
| 启用 | `setPluginDisabled(id, false)` | 恢复可用，但不自动显示 |
| 查询 | `isPluginEnabled(id)` | 返回是否启用 |
| 列举 | `getEnabledPlugins()` | 返回所有启用的插件 ID |

禁用的插件不会出现在：
- `getActivePluginsByPosition()` 的结果中
- 工具栏按钮/右键菜单的贡献点中

---

## 七、插件间通信（事件总线）

`eventBus.ts` 提供的发布/订阅事件：

| 事件 | 载荷 | 发射时机 |
|------|------|----------|
| `EVENT_FILE_SELECTION` | `{ selectedPaths, entries }` | 选中文件变化 |
| `EVENT_FILE_OPENED` | `{ path }` | 文件被打开 |
| `EVENT_DIRECTORY_CHANGED` | `directoryPath` | 目录切换 |
| `EVENT_CLIPBOARD_CHANGED` | `{ operation, files }` | 剪切板操作 |

```typescript
import { on, emit, EVENT_FILE_SELECTION } from '../eventBus';

// 订阅
const unsub = on(EVENT_FILE_SELECTION, (data) => {
  console.log('选中了', data.selectedPaths.length, '个文件');
});

// 取消订阅
unsub();
```

---

## 八、布局与尺寸

插件布局由 `AppLayout.tsx` 自动处理：

```
┌─────────────────────────────────────────────────────┐
│ Toolbar                                              │
├────────────┬───────────────────┬────────────────────┤
│ left       │ center            │ right              │
│ (1个可见)   │ FileList/Search   │ (1个可见)          │
├────────────┴───────────────────┴────────────────────┤
│ bottom（多个水平并排：Terminal | Output | Tasks ）    │
├─────────────────────────────────────────────────────┤
│ StatusBar                                            │
└─────────────────────────────────────────────────────┘
```

### 关键行为

- left/right 每个位置每次只显示一个插件（通过 `activeTab` 切换）
- bottom 位置支持多个插件水平并排
- 所有 SplitPane 支持鼠标拖拽调整大小
- 尺寸/显隐状态持久化到 localStorage

---

## 九、Rust 后端命令清单

| Tauri Command | 插件使用方 | 说明 |
|--------------|-----------|------|
| `list_directory` | FileExplorer | 列出目录内容 |
| `search_files` | 通用 | 按文件名搜索 |
| `search_content` | SearchBar | 全文内容搜索 |
| `read_text_file` | MarkdownPreview, PreviewPlugin | 读取文本文件 |
| `write_text_file` | AI 助手 | 写入文本文件 |
| `read_file_bytes` | PreviewPlugin | 读取二进制文件 |
| `get_file_info` | PreviewPlugin | 获取文件信息 |
| `get_system_dirs` | FileExplorer | 系统目录 |
| `get_drives` | FileExplorer | 驱动器列表 |
| `get_home_dir` | 启动时 | 用户目录 |
| `create_directory` | 通用 | 创建目录 |
| `rename_item` | 通用 | 重命名 |
| `delete_item` | 通用 | 删除 |
| `copy_items` | 通用 | 复制 |
| `move_items` | 通用 | 移动 |
| `diff_files` | DiffViewer | 文件 diff |
| `highlight_file` | PreviewPlugin | 语法高亮 |
| `get_git_status` | GitStatus | Git 状态 |
| `ai_ask` | AI 助手 | AI 自然语言指令 |
| `mcp_list_tools` | 插件管理 | 列出 MCP 工具 |
| `mcp_call_tool` | 插件管理 | 调用 MCP 工具 |

---

## 十、最佳实践

### 1. 插件职责单一
每个插件只做一件事。如果需要复杂功能，拆分为多个插件。

### 2. 无状态优先
尽量使用 zustand store 管理状态，插件组件保持轻量。

### 3. MCP 工具声明完整
为每个功能声明完整的 `inputSchema`，让 LLM 能正确理解参数。

### 4. 贡献点收敛
`toolbarActions` 和 `contextMenuItems` 只暴露最常用的操作，不要堆砌。

### 5. 错误处理
所有 `invoke` 调用必须 try-catch，优雅降级。

---

## 十一、参考

- `src/plugins/types.ts` — 完整类型定义
- `src/plugins/PluginManager/index.tsx` — 插件管理实现参考
- `src/plugins/AiAssistant/index.tsx` — AI 助手实现参考
- `src/plugins/DiffViewer/index.tsx` — 带 MCP + 右键菜单的插件实现参考
- `src-tauri/src/commands/mcp/mod.rs` — MCP 工具注册表
