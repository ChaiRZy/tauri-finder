import { registerPlugin } from './registry';
import { usePluginStore } from './pluginStore';
import FileExplorerPlugin from './FileExplorer';
import TerminalPlugin from './Terminal';
import PreviewPlugin from './PreviewPlugin';
import OutputPlugin from './Output';
import TasksPanel from './Tasks';
import DiffViewer from './DiffViewer';
import MarkdownPreview from './MarkdownPreview';
import GitStatusPlugin from './GitStatus';
import ThemeManager from './ThemeManager';
import DirectoryTree from './DirectoryTree';
import TagExplorer from './TagExplorer';
import AiAssistant from './AiAssistant';
import PluginManager from './PluginManager';
import HtmlPreview from './HtmlPreview';

/** 初始化所有内置插件 */
export function initPlugins() {
  registerPlugin({
    id: 'file-explorer',
    title: '文件',
    summary: '浏览和导航文件系统目录树',
    component: FileExplorerPlugin,
    position: 'left',
    defaultSize: 25,
    defaultUnit: '%',
    minSize: 140,
    maxSize: 600,
    mcpTools: [{
      name: 'list_directory',
      description: '列出指定目录下的文件和子目录',
      command: 'list_directory',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string', description: '目录路径' } },
        required: ['path'],
      },
    }, {
      name: 'get_system_dirs',
      description: '获取系统常用目录列表（桌面、下载等）',
      command: 'get_system_dirs',
      inputSchema: { type: 'object', properties: {} },
    }, {
      name: 'get_drives',
      description: '获取系统驱动器列表',
      command: 'get_drives',
      inputSchema: { type: 'object', properties: {} },
    }],
  });

  registerPlugin({
    id: 'terminal',
    title: '命令行',
    summary: '嵌入式终端模拟器，支持多标签和多 Shell',
    component: TerminalPlugin,
    position: 'bottom',
    defaultSize: 220,
    minSize: 80,
    maxSize: 600,
    defaultVisible: false,
    mcpTools: [],
  });

  registerPlugin({
    id: 'output',
    title: '输出',
    summary: '操作日志和标准输出聚合视图',
    component: OutputPlugin,
    position: 'bottom',
    defaultSize: 200,
    minSize: 80,
    maxSize: 600,
    defaultVisible: false,
    mcpTools: [],
  });

  registerPlugin({
    id: 'tasks',
    title: '任务',
    summary: '批量操作进度跟踪面板',
    component: TasksPanel,
    position: 'bottom',
    defaultSize: 200,
    minSize: 80,
    maxSize: 600,
    defaultVisible: false,
    mcpTools: [],
  });

  registerPlugin({
    id: 'preview',
    title: '预览',
    summary: '文件预览（图片、视频、音频、PDF、代码语法高亮、JSON 树、十六进制）',
    component: PreviewPlugin,
    position: 'right',
    defaultSize: 280,
    minSize: 200,
    maxSize: 500,
    mcpTools: [{
      name: 'read_text_file',
      description: '读取文本文件内容',
      command: 'read_text_file',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string', description: '文件路径' } },
        required: ['path'],
      },
    }, {
      name: 'read_file_bytes',
      description: '读取文件的二进制字节',
      command: 'read_file_bytes',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' },
          max_bytes: { type: 'number', description: '最大字节数' },
        },
        required: ['path'],
      },
    }, {
      name: 'highlight_file',
      description: '获取代码文件的语法高亮 HTML',
      command: 'highlight_file',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string', description: '文件路径' } },
        required: ['path'],
      },
    }],
  });

  registerPlugin({
    id: 'diff-viewer',
    title: 'Diff 对比',
    summary: '对比两个文件的差异',
    component: DiffViewer,
    position: 'right',
    defaultSize: 320,
    minSize: 200,
    maxSize: 600,
    mcpTools: [{
      name: 'diff_files',
      description: '对比两个文件的内容差异，返回行级别 diff',
      command: 'diff_files',
      inputSchema: {
        type: 'object',
        properties: {
          path_a: { type: 'string', description: '第一个文件路径' },
          path_b: { type: 'string', description: '第二个文件路径' },
        },
        required: ['path_a', 'path_b'],
      },
    }],
    contextMenuItems: [{
      id: 'diff-compare',
      label: 'Compare Selected',
      icon: null,
      when: 'has-selection',
      action: ({ selectedEntries }) => {
        if (selectedEntries.length === 2) {
          usePluginStore.getState().showPlugin('diff-viewer');
        }
      },
    }],
  });

  registerPlugin({
    id: 'markdown-preview',
    title: 'Markdown Preview',
    summary: 'Markdown 文件渲染预览',
    component: MarkdownPreview,
    position: 'right',
    defaultSize: 320,
    minSize: 200,
    maxSize: 600,
    defaultVisible: false,
    mcpTools: [{
      name: 'render_markdown',
      description: '渲染 Markdown 文本为 HTML',
      command: 'read_text_file',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Markdown 文件路径' } },
        required: ['path'],
      },
    }],
  });

  registerPlugin({
    id: 'html-preview',
    title: 'HTML Preview',
    summary: '选中 .html 文件后以 iframe 实时渲染预览',
    component: HtmlPreview,
    position: 'right',
    defaultSize: 360,
    minSize: 200,
    maxSize: 700,
    defaultVisible: false,
    mcpTools: [{
      name: 'preview_html',
      description: '预览 HTML 文件内容（iframe 渲染）',
      command: 'read_text_file',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string', description: 'HTML 文件路径' } },
        required: ['path'],
      },
    }],
  });

  registerPlugin({
    id: 'git-status',
    title: 'Git Status',
    summary: '显示当前 Git 仓库的变更状态',
    component: GitStatusPlugin,
    position: 'right',
    defaultSize: 280,
    minSize: 200,
    maxSize: 500,
    defaultVisible: false,
    mcpTools: [{
      name: 'get_git_status',
      description: '获取 Git 仓库当前工作区状态（修改、暂存、未跟踪等）',
      command: 'get_git_status',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string', description: '仓库路径' } },
        required: ['path'],
      },
    }],
  });

  registerPlugin({
    id: 'theme-manager',
    title: 'Theme',
    summary: 'UI 主题和字体自定义',
    component: ThemeManager,
    position: 'right',
    defaultSize: 320,
    minSize: 250,
    maxSize: 600,
    defaultVisible: false,
    mcpTools: [],
  });

  // ── 内置管理插件 ──
  registerPlugin({
    id: 'plugin-manager',
    title: '插件管理',
    summary: '查看和开关所有插件，查看 MCP 能力',
    component: PluginManager,
    position: 'right',
    defaultSize: 320,
    minSize: 250,
    maxSize: 600,
    defaultVisible: false,
    mcpTools: [],
    toolbarActions: [{
      id: 'plugin-manager-toggle',
      label: '插件管理',
      order: 100,
      action: () => usePluginStore.getState().togglePlugin('plugin-manager'),
      isActive: () => usePluginStore.getState().visible['plugin-manager'] ?? false,
    }],
  });

  registerPlugin({
    id: 'ai-assistant',
    title: 'AI 助手',
    summary: '通过自然语言操作文件（AI Agent 插件）',
    component: AiAssistant,
    position: 'right',
    defaultSize: 360,
    minSize: 280,
    maxSize: 700,
    defaultVisible: false,
    mcpTools: [{
      name: 'ai_ask',
      description: '向 AI 助手提问，用自然语言操作文件系统',
      command: 'ai_ask',
      inputSchema: {
        type: 'object',
        properties: { message: { type: 'string', description: '用户消息' } },
        required: ['message'],
      },
    }],
    toolbarActions: [{
      id: 'ai-assistant-toggle',
      label: 'AI',
      order: 90,
      action: () => usePluginStore.getState().togglePlugin('ai-assistant'),
      isActive: () => usePluginStore.getState().visible['ai-assistant'] ?? false,
    }],
    contextMenuItems: [{
      id: 'ai-ask-selected',
      label: 'AI 助手 - 处理选中文件',
      icon: null,
      when: 'has-selection',
      action: () => {
        usePluginStore.getState().showPlugin('ai-assistant');
      },
    }],
  });

  registerPlugin({
    id: 'directory-tree',
    title: 'Directory Tree',
    summary: '树状目录浏览器（替代平面 Sidebar）',
    component: DirectoryTree,
    position: 'left',
    defaultSize: 260,
    minSize: 140,
    maxSize: 600,
    defaultVisible: false,
  });

  registerPlugin({
    id: 'tag-explorer',
    title: 'Tag Explorer',
    summary: '标签管理：查看/添加标签并导航到标记文件夹',
    component: TagExplorer,
    position: 'right',
    defaultSize: 260,
    minSize: 200,
    maxSize: 500,
    defaultVisible: false,
  });
}
