import type { ReactNode } from 'react';

/** 尺寸单位 */
export type SizeUnit = 'px' | '%';

/** 叶子节点：主内容区或指定插件 */
export type LayoutLeaf =
  | 'content'
  | { plugin: string };

/** 分割节点：水平或垂直拆分 */
export interface LayoutSplit {
  direction: 'row' | 'col';
  /** 第一个面板的尺寸（即 right/bottom 面板的固定尺寸） */
  size?: number;
  /** 尺寸单位（默认 px） */
  unit?: SizeUnit;
  minSize?: number;
  maxSize?: number;
  children: [LayoutNode, LayoutNode];
  /** 面板应出现在右侧/底部（而非左侧/顶部），用于 right/bottom 插件 */
  reverse?: boolean;
  /** 拖拽尺寸变化回调（持久化用） */
  onSizeChange?: (size: number) => void;
}

export type LayoutNode = LayoutLeaf | LayoutSplit;

/** 将 LayoutNode 解析为 ReactNode 的渲染上下文 */
export interface LayoutContext {
  pluginMap: Record<string, ReactNode>;
  contentNode: ReactNode;
}
