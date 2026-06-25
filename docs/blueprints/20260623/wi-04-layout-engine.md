# WI-04: Layout Engine 抽象

## 概述

将 AppLayout 中硬编码的 SplitPane 嵌套逻辑提取为可声明式配置的 Layout Engine。支持 `row`（水平）/ `col`（垂直）递归布局，使插件可以灵活声明其位置与排列方式，同时保持当前行为不变。

## 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/layout/types.ts` | 新增 | LayoutConfig 类型定义 |
| `src/layout/LayoutEngine.tsx` | 新增 | 渲染 LayoutConfig 树的递归组件 |
| `src/layout/index.ts` | 新增 | barrel export |
| `src/components/Layout/AppLayout.tsx` | 修改 | 使用 LayoutEngine 替代内联 SplitPane 逻辑 |
| `src/components/Layout/SplitPane.tsx` | 不改 | 保持现有通用组件 |

## 契约与骨架

### LayoutConfig 类型

```ts
// src/layout/types.ts

export type LayoutLeaf = 'content' | { plugin: string };

export interface LayoutSplit {
  direction: 'row' | 'col';
  ratio?: number;         // 默认 0.5
  minSize?: number;
  maxSize?: number;
  children: [LayoutNode, LayoutNode];
}

export type LayoutNode = LayoutLeaf | LayoutSplit;
```

- `'content'` 表示主文件浏览区域
- `{ plugin: 'terminal' }` 表示渲染某个已注册的插件

### LayoutEngine 组件

```tsx
// src/layout/LayoutEngine.tsx

interface Props {
  config: LayoutNode;
  /** 插件 ID → ReactNode 的映射（由 AppLayout 传入） */
  pluginMap: Record<string, ReactNode>;
}
```

递归逻辑：
1. 如果 node 是 `'content'` → 渲染 `<ContentArea />`
2. 如果 node 是 `{ plugin: id }` → 从 `pluginMap` 取组件渲染
3. 如果 node 是 `LayoutSplit` → 渲染 `<SplitPane>` 并递归 children

### AppLayout 迁移

当前布局逻辑（等价的声明式配置）：

```ts
const layoutConfig: LayoutNode = bottomPlugins.length > 0
  ? {
      direction: 'col',
      children: [
        {
          direction: 'row',
          children: [
            leftPlugin ? { plugin: leftPlugin.id } : 'content',
            rightPlugin
              ? { direction: 'row', children: ['content', { plugin: rightPlugin.id }] }
              : 'content',
          ],
        },
        { plugin: bottomPluginId }, // 简化为单一底部插件
      ],
    }
  : {
      direction: 'row',
      children: [
        leftPlugin ? { plugin: leftPlugin.id } : 'content',
        rightPlugin ? { direction: 'row', children: ['content', { plugin: rightPlugin.id }] } : 'content',
      ],
    };
```

> 注意：由于 AppLayout 仍负责动态决定 `bottomPlugins`, `leftPlugin`, `rightPlugin`，这些逻辑不会全部移入 LayoutEngine。LayoutEngine 只负责把 `LayoutNode` 渲染为正确的 SplitPane 嵌套。

### 底部多插件的处理

当前 bottom 支持多个插件水平排列（如 terminal + output + tasks）。LayoutEngine 将继续支持这一模式：底部区域内部仍然用 `direction: 'row'` 的 SplitPane 串联多个插件。

```ts
const bottomRow: LayoutNode = bottomPlugins.length === 0
  ? null
  : bottomPlugins.length === 1
    ? { plugin: bottomPlugins[0].id }
    : {
        direction: 'row',
        children: bottomPlugins.map((p, i) =>
          i < bottomPlugins.length - 1
            ? { plugin: p.id }
            : { plugin: p.id }
        ).reduceRight(...) // 递归构建
      };
```

实际实现时可以用辅助函数构建 bottom row。

## 流程概述

```
AppLayout 根据 pluginStore 状态动态构建 LayoutNode 树
  → <LayoutEngine config={tree} pluginMap={renderedPlugins} />
  → 递归遍历节点：
    - 'content' → <ContentArea />
    - { plugin } → 已注册的组件（从 pluginMap 取出）
    - { direction, children } → <SplitPane> 包裹两个子节点
```

## 任务拆分

| ID | 标题 | 复杂度 | 依赖 | 验收点 |
|----|------|--------|------|--------|
| WI-04-01 | 创建 `src/layout/types.ts` 定义 LayoutConfig | S | 无 | 类型定义正确，编译通过 |
| WI-04-02 | 实现 LayoutEngine 递归组件 | M | WI-04-01 | LayoutNode 正确渲染为 SplitPane 树 |
| WI-04-03 | 迁移 AppLayout 使用 LayoutEngine | M | WI-04-02 | 运行后布局与迁移前完全一致 |
| WI-04-04 | 回归验证：切换插件显隐、调整尺寸、初始布局 | S | WI-04-03 | 所有布局操作行为不变 |

## Sub-agent Briefing

### WI-04-01: 布局类型定义

- 目标：创建 layout/types.ts，定义 LayoutLeaf / LayoutSplit / LayoutNode
- 复杂度：S
- 允许修改：新建 `src/layout/types.ts`, `src/layout/index.ts`
- 禁止触碰：其他现有文件
- 关键契约：见上方类型定义
- 验收点：import 类型后编译通过

### WI-04-02: LayoutEngine 递归组件

- 目标：实现 LayoutEngine 组件，递归渲染 LayoutNode 树
- 复杂度：M
- 依赖：WI-04-01
- 允许修改：新建 `src/layout/LayoutEngine.tsx`
- 关键契约：
  - props: `{ config: LayoutNode; pluginMap: Record<string, ReactNode> }`
  - `LayoutLeaf['content']` → `<ContentArea />` (import from AppLayout 或内联)
  - `LayoutLeaf['plugin']` → `pluginMap[id]`
  - `LayoutSplit` → `<SplitPane direction ...>` 递归 children
- 验收点：传入简单 config 渲染出正确嵌套结构

### WI-04-03: 迁移 AppLayout

- 目标：AppLayout 使用 LayoutEngine 替代内联逻辑
- 复杂度：M
- 依赖：WI-04-02
- 允许修改：`src/components/Layout/AppLayout.tsx`
- 关键契约：行为完全不变，仅重构渲染逻辑
- 验收点：npm run build 通过，界面与之前一致
