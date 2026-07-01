import { useEffect, useMemo, useCallback } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { usePluginStore } from '../../plugins/pluginStore';
import { getAllPlugins } from '../../plugins/registry';
import { useAppTabsStore } from '../../stores/appTabsStore';
import { emit, EVENT_FILE_SELECTION, EVENT_DIRECTORY_CHANGED } from '../../plugins/eventBus';
import AppTabsBar from '../AppTabs/AppTabsBar';
import TabContent from '../AppTabs/TabContent';
import Toolbar from '../Toolbar/Toolbar';
import ContextMenu from '../ContextMenu/ContextMenu';
import { CreateDialog, RenameDialog, PropertiesDialog, ContextMenuSettings, QuickCommandDialog, TagDialog, TagManagerDialog } from '../Dialogs';
import StatusBar from '../StatusBar/StatusBar';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useFileWatcher } from '../../hooks/useFileWatcher';
import { useUiStore } from '../../stores/uiStore';
import { getHomeDir } from '../../utils/constants';
import PluginLauncher from '../PluginLauncher/PluginLauncher';
import './AppLayout.css';

export default function AppLayout() {
  const navigateTo = useFileStore((s) => s.navigateTo);
  const dialog = useUiStore((s) => s.dialog);
  const visible = usePluginStore((s) => s.visible);

  const activeTab = useAppTabsStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const setTabTitle = useAppTabsStore((s) => s.setTabTitle);
  const setTabDir = useAppTabsStore((s) => s.setTabDir);

  useKeyboard();
  useContextMenu();
  useFileWatcher();

  useEffect(() => {
    getHomeDir().then((home) => {
      navigateTo(home);
      setTabDir(useAppTabsStore.getState().tabs[0].id, home);
    });
  }, []);

  const selectedPaths = useUiStore((s) => s.selectedPaths);
  const entries = useFileStore((s) => s.entries);
  useEffect(() => {
    emit(EVENT_FILE_SELECTION, {
      selectedPaths: Array.from(selectedPaths),
      entries,
    });
  }, [selectedPaths, entries]);

  const currentDir = useFileStore((s) => s.currentDir);
  useEffect(() => {
    if (currentDir) emit(EVENT_DIRECTORY_CHANGED, currentDir);
  }, [currentDir]);

  // Keep the files tab's currentDir in sync
  useEffect(() => {
    if (activeTab?.type === 'files' && currentDir) {
      setTabDir(activeTab.id, currentDir);
    }
  }, [currentDir, activeTab?.id]);

  const handleTabTitleChange = useCallback((title: string) => {
    if (activeTab) {
      setTabTitle(activeTab.id, title);
    }
  }, [activeTab, setTabTitle]);

  // Build plugin map for left sidebar
  const leftPlugins = useMemo(() => getAllPlugins().filter((p) => p.position === 'left'), []);
  const leftVisiblePlugin = useMemo(() =>
    leftPlugins.find((p) => visible[p.id]), [leftPlugins, visible]);

  return (
    <div className="app-layout">
      {/* Chrome-style tabs at very top */}
      <AppTabsBar />
      <Toolbar />
      <div className="app-body">
        {/* Left sidebar (file explorer) */}
        {leftVisiblePlugin && (
          <div className="app-sidebar">
            <leftVisiblePlugin.component />
          </div>
        )}
        {/* Main content */}
        <div className="app-content">
          {activeTab && (
            <TabContent tab={activeTab} onTitleChange={handleTabTitleChange} />
          )}
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
      <PluginLauncher />
    </div>
  );
}
