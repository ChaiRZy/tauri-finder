import type { ComponentType, ReactNode } from 'react';
import type { SizeUnit } from '../layout/types';

/** 插件停靠位置 */
export type PluginPosition = 'left' | 'right' | 'bottom';

/** MCP 工具定义 — 描述一个可被 LLM/MCP 客户端调用的能力 */
export interface PluginMcpTool {
  /** 工具名称（全局唯一，如 `diff_files`） */
  name: string;
  /** 工具描述（LLM 理解用途用） */
  description: string;
  /** 输入参数 JSON Schema（简化版） */
  inputSchema: Record<string, unknown>;
  /** 映射到的 Tauri command 名称 */
  command: string;
}

/** 插件暴露的上下文菜单项 */
export interface PluginContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  /** 何时显示：选中文件时 / 空白处 / 始终 */
  when: 'has-selection' | 'single-selection' | 'empty-area' | 'always';
  /** 执行动作（收到 hideMenu 回调用于关闭菜单） */
  action: (context: {
    selectedEntries: { name: string; path: string; is_dir: boolean }[];
    currentDir: string;
  }) => void;
}

/** 插件暴露的工具栏按钮 */
export interface PluginToolbarAction {
  id: string;
  label: string;
  icon?: ReactNode;
  /** 在工具栏分组中的位置排序 */
  order: number;
  action: () => void;
  /** 是否高亮（toggle 类按钮用） */
  isActive?: () => boolean;
}

/** 插件定义 */
export interface PluginDefinition {
  /** 唯一标识 */
  id: string;
  /** 显示标题 */
  title: string;
  /** 图标（可选，lucide icon name） */
  icon?: string;
  /** 渲染组件 */
  component: ComponentType;
  /** 默认停靠位置 */
  position: PluginPosition;
  /** 最小尺寸（px） */
  minSize?: number;
  /** 最大尺寸（px） */
  maxSize?: number;
  /** 默认尺寸 */
  defaultSize?: number;
  /** 尺寸单位（px 或 %，默认 px） */
  defaultUnit?: SizeUnit;
  /** 默认是否可见 */
  defaultVisible?: boolean;

  /* ── MCP 能力声明 ── */
  /** 该插件暴露给 LLM/AI 的工具列表 */
  mcpTools?: PluginMcpTool[];
  /** 简短的插件能力描述（如 "对比两个文件差异"） */
  summary?: string;

  /* ── 生命周期 ── */
  onActivate?: () => void;
  onDeactivate?: () => void;
  onResize?: (size: number) => void;

  /* ── 贡献点 ── */
  contextMenuItems?: PluginContextMenuItem[];
  toolbarActions?: PluginToolbarAction[];
  /** @deprecated 用 toolbarActions 替代 */
  legacyToolbarIds?: string[];
}
