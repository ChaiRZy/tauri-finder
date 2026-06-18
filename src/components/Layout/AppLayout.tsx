import { useEffect } from 'react';
import { useFileStore } from '../../stores/fileStore';
import Sidebar from '../Sidebar/Sidebar';
import Toolbar from '../Toolbar/Toolbar';
import FileList from '../FileList/FileList';
import FileTabs from '../FileList/FileTabs';
import PreviewPanel from '../Preview/PreviewPanel';
import ContextMenu from '../ContextMenu/ContextMenu';
import { CreateDialog, RenameDialog, PropertiesDialog, ContextMenuSettings, QuickCommandDialog, TagDialog, TagManagerDialog } from '../Dialogs';
import TerminalPanel from '../Terminal/TerminalPanel';
import SearchBar from '../SearchBar/SearchBar';
import StatusBar from '../StatusBar/StatusBar';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useUiStore } from '../../stores/uiStore';
import { getHomeDir } from '../../utils/constants';
import './AppLayout.css';

export default function AppLayout() {
  const navigateTo = useFileStore((s) => s.navigateTo);
  const loading = useFileStore((s) => s.loading);
  const error = useFileStore((s) => s.error);
  const dialog = useUiStore((s) => s.dialog);
  const showPreview = useUiStore((s) => s.showPreview);

  useKeyboard();
  useContextMenu();

  useEffect(() => {
    getHomeDir().then((home) => {
      navigateTo(home);
    });
  }, []);

  return (
    <div className="app-layout">
      <Toolbar />
      <div className="app-body">
        <Sidebar />
        <div className="content-area">
          <FileTabs />
          <SearchBar />
          <div className="file-area">
            {loading && <div className="loading-indicator">Loading...</div>}
            {error && <div className="error-indicator">{error}</div>}
            {!loading && !error && <FileList />}
          </div>
        </div>
        {showPreview && (
          <div className="preview-pane">
            <PreviewPanel />
          </div>
        )}
      </div>
      <TerminalPanel />
      <StatusBar />
      <ContextMenu />
      {dialog?.type === 'create' && <CreateDialog />}
      {dialog?.type === 'rename' && <RenameDialog />}
      {dialog?.type === 'properties' && <PropertiesDialog />}
      {dialog?.type === 'contextMenuSettings' && <ContextMenuSettings />}
      {dialog?.type === 'quickCommand' && <QuickCommandDialog />}
      {dialog?.type === 'tagManager' && dialog?.parentPath && <TagDialog />}
      {dialog?.type === 'tagManager' && !dialog?.parentPath && <TagManagerDialog />}
    </div>
  );
}
