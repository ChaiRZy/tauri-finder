# WI-02: Markdown Preview Plugin

## 概述

在右侧面板注册一个 Markdown 预览插件，当用户选中 `.md` 文件时自动渲染 Markdown 内容；选中非 `.md` 文件时显示提示或回退到现有 PreviewPanel。

## 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `package.json` | 修改 | 新增 `marked` 依赖 |
| `src/plugins/index.ts` | 修改 | 注册 `markdown-preview` 插件（right 位置） |
| `src/plugins/MarkdownPreview/index.tsx` | 新增 | Markdown 预览组件 |
| `src/plugins/MarkdownPreview/MarkdownPreview.css` | 新增 | Markdown 渲染样式 |

## 契约与骨架

### MarkdownPreview 组件

```tsx
interface MarkdownPreviewProps {
  // 无 props，直接从 useUiStore.selectedPaths 读取选中文件
}
```

行为：
1. 监听 `selectedPaths`，若选中唯一文件且扩展名为 `.md`，调用 `invoke('read_text_file', { path })` 读取内容
2. 用 `marked` 解析 Markdown → HTML
3. 用 `dangerouslySetInnerHTML` 渲染在 scrollable 容器中
4. 选中非 `.md` 文件时显示 "Select a .md file to preview"
5. 无选中时显示占位

### 注册配置

```ts
registerPlugin({
  id: 'markdown-preview',
  title: 'Markdown Preview',
  component: MarkdownPreview,
  position: 'right',
  defaultSize: 320,
  minSize: 200,
  maxSize: 600,
  defaultVisible: false,
});
```

## 流程概述

```
用户选中 .md 文件
  → MarkdownPreview 组件检测 selection
  → 调用 read_text_file 读取内容
  → marked(content) 解析为 HTML
  → 渲染到预览区（带样式）
  
用户切换选中到非 .md 文件
  → 显示提示文字，不清除上次渲染内容（保留）
```

## 任务拆分

| ID | 标题 | 复杂度 | 依赖 | 验收点 |
|----|------|--------|------|--------|
| WI-02-01 | 安装 `marked` 依赖 + 创建插件目录/文件骨架 | S | 无 | `npm install` 成功，文件结构就绪 |
| WI-02-02 | 实现 MarkdownPreview 组件：读取、解析、渲染 | M | WI-02-01 | 选中 .md 文件时正确渲染 HTML |
| WI-02-03 | 注册到插件系统 + CSS 样式 | S | WI-02-02 | 右侧面板显示 Markdown 内容，样式美观 |
| WI-02-04 | 回归验证：构建 + 功能自测 | S | WI-02-03 | `npm run build` 通过，手动点选 .md 渲染正常 |

## Sub-agent Briefing

### WI-02-01: 安装依赖 + 创建骨架

- 目标：添加 marked 依赖，创建 MarkdownPreview 文件夹和空组件
- 复杂度：S
- 允许修改：`package.json`，新建 `src/plugins/MarkdownPreview/`
- 禁止触碰：其他现有文件
- 验收点：`npm install` 通过，目录结构正确

### WI-02-02: 实现 MarkdownPreview 组件

- 目标：监听选中文件，读取 .md 内容并用 marked 渲染
- 复杂度：M
- 依赖：WI-02-01
- 允许修改：`src/plugins/MarkdownPreview/index.tsx`
- 关键契约：
  - 使用 `useUiStore.selectedPaths` 获取选中
  - 使用 `invoke('read_text_file', { path })` 读取内容
  - 使用 `marked(content)` 解析 HTML
- 验收点：选中 .md 文件时渲染内容，选中其他文件时显示 fallback

### WI-02-03: 注册 + 样式

- 目标：在 plugin index 注册，添加渲染样式
- 复杂度：S
- 依赖：WI-02-02
- 允许修改：`src/plugins/index.ts`，新建 `src/plugins/MarkdownPreview/MarkdownPreview.css`
- 关键契约：注册 `id: 'markdown-preview'`, `position: 'right'`
- 验收点：右侧面板可见，Markdown 样式（标题/代码块/列表等）美观
