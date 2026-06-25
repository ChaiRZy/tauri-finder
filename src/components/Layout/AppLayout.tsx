import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { usePluginStore } from '../../plugins/pluginStore';
import { getAllPlugins, getPlugin } from '../../plugins/registry';
import { emit, EVENT_FILE_SELECTION, EVENT_DIRECTORY_CHANGED } from '../../plugins/eventBus';
import Toolbar from '../Toolbar/Toolbar';
import FileList from '../FileList/FileList';
import FileTabs from '../FileList/FileTabs';
import ContextMenu from '../ContextMenu/ContextMenu';
import { CreateDialog, RenameDialog, PropertiesDialog, ContextMenuSettings, QuickCommandDialog, TagDialog, TagManagerDialog } from '../Dialogs';
import SearchBar from '../SearchBar/SearchBar';
import StatusBar from '../StatusBar/StatusBar';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useFileWatcher } from '../../hooks/useFileWatcher';
import { useUiStore } from '../../stores/uiStore';
import { getHomeDir } from '../../utils/constants';
import { LayoutEngine } from '../../layout';
import type { LayoutNode } from '../../layout';
import type { PluginPosition, PluginDefinition } from '../../plugins/types';
import './AppLayout.css';

/** 主内容区 */
function ContentArea() {
  const loading = useFileStore((s) => s.loading);
  const error = useFileStore((s) => s.error);

  return (
    <div className="content-area">
      <FileTabs />
      <SearchBar />
      <div className="file-area">
        {loading && <div className="loading-indicator">Loading...</div>}
        {error && <div className="error-indicator">{error}</div>}
        {!loading && !error && <FileList />}
      </div>
    </div>
  );
}

export default function AppLayout() {
  const navigateTo = useFileStore((s) => s.navigateTo);
  const dialog = useUiStore((s) => s.dialog);

  const visible = usePluginStore((s) => s.visible);
  const sizes = usePluginStore((s) => s.sizes);
  const activeTab = usePluginStore((s) => s.activeTab);
  const setPluginSize = usePluginStore((s) => s.setPluginSize);
  useKeyboard();
  useContextMenu();
  useFileWatcher();

  useEffect(() => {
    getHomeDir().then((home) => {
      navigateTo(home);
    });
  }, []);

  // 监听文件选中变化 → 广播给插件
  const selectedPaths = useUiStore((s) => s.selectedPaths);
  const entries = useFileStore((s) => s.entries);
  useEffect(() => {
    emit(EVENT_FILE_SELECTION, {
      selectedPaths: Array.from(selectedPaths),
      entries,
    });
  }, [selectedPaths, entries]);

  // 监听目录变化
  const currentDir = useFileStore((s) => s.currentDir);
  useEffect(() => {
    if (currentDir) emit(EVENT_DIRECTORY_CHANGED, currentDir);
  }, [currentDir]);

  // 按位置分组插件（每次渲染从注册表实时读取，确保 initPlugins 后能获取到）
  function getPluginGroups() {
    const all = getAllPlugins();
    return {
      left: all.filter((p) => p.position === 'left'),
      right: all.filter((p) => p.position === 'right'),
      bottom: all.filter((p) => p.position === 'bottom'),
    };
  }

  // 每个位置当前应渲染的插件
  const leftPlugin = useMemo(() => resolveActivePlugin(getPluginGroups().left, activeTab, visible), [activeTab, visible]);
  const rightPlugin = useMemo(() => resolveActivePlugin(getPluginGroups().right, activeTab, visible), [activeTab, visible]);
  const bottomPlugins = useMemo(() => getPluginGroups().bottom.filter((p) => visible[p.id]), [visible]);

  // 构建 pluginMap（每次渲染前从注册表实时读取）
  function buildPluginMap(): Record<string, ReactNode> {
    const map: Record<string, ReactNode> = {};
    const groups = getPluginGroups();
    for (const p of groups.left) {
      map[p.id] = <p.component />;
    }
    for (const p of groups.right) {
      map[p.id] = <p.component />;
    }
    for (const p of groups.bottom) {
      map[p.id] = <p.component />;
    }
    return map;
  }

  // 底部多插件的尺寸变化处理
  const handleBottomResize = useMemo(() => {
    if (bottomPlugins.length === 0) return undefined;
    const totalHeight = bottomPlugins.reduce((sum, p) => sum + (sizes[p.id] ?? p.defaultSize ?? 220), 0);
    return (s: number) => {
      if (totalHeight <= 0) return;
      const ratio = s / totalHeight;
      for (const p of bottomPlugins) {
        const cur = sizes[p.id] ?? p.defaultSize ?? 220;
        setPluginSize(p.id, Math.round(cur * ratio));
      }
    };
  }, [bottomPlugins, sizes, setPluginSize]);

  // 根据当前可见插件构建布局树
  const layoutConfig = useMemo((): LayoutNode => {
    const mkLeftOnResize = leftPlugin
      ? (s: number) => setPluginSize(leftPlugin!.id, s)
      : undefined;
    const mkRightOnResize = rightPlugin
      ? (s: number) => setPluginSize(rightPlugin!.id, s)
      : undefined;
    const hasLeft = leftPlugin != null;
    const hasRight = rightPlugin != null;
    const hasBottom = bottomPlugins.length > 0;

    // 先构建水平（left-content-right）部分
    let horizontal: LayoutNode = 'content';
    if (hasLeft && hasRight) {
      horizontal = {
        direction: 'row' as const,
        size: sizes[leftPlugin!.id] ?? leftPlugin!.defaultSize ?? 260,
        unit: leftPlugin!.defaultUnit ?? 'px',
        minSize: leftPlugin!.minSize ?? 140,
        maxSize: leftPlugin!.maxSize ?? 600,
        onSizeChange: mkLeftOnResize,
        children: [
          { plugin: leftPlugin!.id },
          {
            direction: 'row' as const,
            size: sizes[rightPlugin!.id] ?? rightPlugin!.defaultSize ?? 280,
            unit: rightPlugin!.defaultUnit ?? 'px',
            minSize: rightPlugin!.minSize ?? 200,
            maxSize: rightPlugin!.maxSize ?? 500,
            onSizeChange: mkRightOnResize,
            reverse: true,
            children: [{ plugin: rightPlugin!.id }, 'content'],
          },
        ],
      };
    } else if (hasLeft) {
      horizontal = {
        direction: 'row' as const,
        size: sizes[leftPlugin!.id] ?? leftPlugin!.defaultSize ?? 260,
        unit: leftPlugin!.defaultUnit ?? 'px',
        minSize: leftPlugin!.minSize ?? 140,
        maxSize: leftPlugin!.maxSize ?? 600,
        onSizeChange: mkLeftOnResize,
        children: [{ plugin: leftPlugin!.id }, 'content'],
      };
    } else if (hasRight) {
      horizontal = {
        direction: 'row' as const,
        size: sizes[rightPlugin!.id] ?? rightPlugin!.defaultSize ?? 280,
        unit: rightPlugin!.defaultUnit ?? 'px',
        minSize: rightPlugin!.minSize ?? 200,
        maxSize: rightPlugin!.maxSize ?? 500,
        onSizeChange: mkRightOnResize,
        reverse: true,
        children: [{ plugin: rightPlugin!.id }, 'content'],
      };
    }

    const bottomOnResize = handleBottomResize;

    // 加入底部
    if (hasBottom && bottomPlugins.length === 1) {
      const bp = bottomPlugins[0];
      return {
        direction: 'col' as const,
        size: sizes[bp.id] ?? bp.defaultSize ?? 220,
        minSize: bp.minSize ?? 80,
        maxSize: bp.maxSize ?? 600,
        onSizeChange: bottomOnResize,
        reverse: true,
        children: [
          { plugin: bp.id },
          horizontal,
        ],
      };
    }

    if (hasBottom && bottomPlugins.length > 1) {
      const totalHeight = bottomPlugins.reduce((sum, p) => sum + (sizes[p.id] ?? p.defaultSize ?? 220), 0);
      const maxSum = bottomPlugins.reduce((sum, p) => sum + (p.maxSize ?? 800), 0);
      const bottomRow = buildBottomRow(bottomPlugins, sizes);
      return {
        direction: 'col' as const,
        size: totalHeight,
        minSize: bottomPlugins[0].minSize ?? 80,
        maxSize: maxSum,
        onSizeChange: bottomOnResize,
        reverse: true,
        children: [bottomRow, horizontal],
      };
    }

    return horizontal;
  }, [leftPlugin, rightPlugin, bottomPlugins, sizes, handleBottomResize]);

  return (
    <div className="app-layout">
      <Toolbar />
      <div className="app-layout__body">
        <div className="app-body">
          <LayoutEngine
            config={layoutConfig}
            context={{
              pluginMap: buildPluginMap(),
              contentNode: <ContentArea />,
            }}
          />
        </div>
      </div>
      <StatusBar />
      <ContextMenu />
      {dialog?.type === 'create' && <CreateDialog />}
      {dialog?.type === 'rename' && <RenameDialog />}
      {dialog?.type === 'properties' && <PropertiesDialog />}
      {dialog?.type === 'contextMenuSettings' && <ContextMenuSettings />}
      {dialog?.type === 'quickCommand' && <QuickCommandDialog />}
      {dialog?.type === 'tagManager' && dialog?.parentPath && <TagDialog />}
      {dialog?.type === 'tagManager' && !dialog?.parentPath && <TagManagerDialog />}

      {/* Debug: show plugin state */}
      <div style={{ position: 'fixed', bottom: 4, left: 4, zIndex: 99999, fontSize: 10, color: '#999', background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: 3 }}>
        visible: {Object.entries(visible).filter(([,v]) => v).map(([k]) => k).join(', ') || 'none'}
        | left: {leftPlugin?.id ?? 'null'}
        | right: {rightPlugin?.id ?? 'null'}
        | bottom: {bottomPlugins.map(p => p.id).join(',') || 'none'}
      </div>
    </div>
  );
}

/** 根据 visible + activeTab 解析某位置当前应渲染的插件 */
function resolveActivePlugin(
  plugins: PluginDefinition[],
  activeTab: Record<PluginPosition, string>,
  visible: Record<string, boolean>,
): PluginDefinition | null {
  if (plugins.length === 0) return null;
  const activeId = activeTab[plugins[0].position];
  if (activeId && visible[activeId]) {
    const def = getPlugin(activeId);
    if (def) return def;
  }
  const visiblePlugin = plugins.find((p) => visible[p.id]);
  return visiblePlugin ?? null;
}

/** 递归构建底部多插件的水平 SplitPane 链 */
function buildBottomRow(plugins: PluginDefinition[], sizes: Record<string, number>): LayoutNode {
  if (plugins.length === 0) return 'content';
  if (plugins.length === 1) return { plugin: plugins[0].id };
  const [first, ...rest] = plugins;
  return {
    direction: 'row' as const,
    size: sizes[first.id] ?? first.defaultSize ?? 200,
    unit: first.defaultUnit ?? 'px',
    minSize: first.minSize ?? 80,
    maxSize: first.maxSize ?? 800,
    children: [{ plugin: first.id }, buildBottomRow(rest, sizes)],
  };
}
