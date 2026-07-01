import { useEffect } from 'react';
import { useFileStore } from '../../stores/fileStore';
import type { AppTab } from '../../stores/appTabsStore';
import FileList from '../FileList/FileList';
import SearchBar from '../SearchBar/SearchBar';
import TerminalPanel from '../Terminal/TerminalPanel';

interface Props {
  tab: AppTab;
  /** Called when tab title should update (e.g. directory change) */
  onTitleChange?: (title: string) => void;
}

function FilesContent({ tab, onTitleChange }: Props) {
  const loading = useFileStore((s) => s.loading);
  const error = useFileStore((s) => s.error);
  const currentDir = useFileStore((s) => s.currentDir);
  const navigateTo = useFileStore((s) => s.navigateTo);

  useEffect(() => {
    if (tab.currentDir && tab.currentDir !== currentDir) {
      navigateTo(tab.currentDir);
    }
  }, [tab.id]);

  useEffect(() => {
    if (currentDir && onTitleChange) {
      const label = currentDir.split(/[/\\]/).filter(Boolean).pop() || currentDir;
      onTitleChange(label);
    }
  }, [currentDir, onTitleChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <SearchBar />
      <div style={{ flex: 1, overflow: 'auto', position: 'relative', minHeight: 0 }}>
        {loading && <div className="loading-indicator">Loading...</div>}
        {error && <div className="error-indicator">{error}</div>}
        {!loading && !error && <FileList />}
      </div>
    </div>
  );
}

function TerminalContent() {
  return (
    <div style={{ height: '100%', overflow: 'hidden' }}>
      <TerminalPanel />
    </div>
  );
}

export default function TabContent({ tab, onTitleChange }: Props) {
  switch (tab.type) {
    case 'files':
      return <FilesContent tab={tab} onTitleChange={onTitleChange} />;
    case 'terminal':
      return <TerminalContent />;
    default:
      return <div style={{ padding: 20, color: '#999' }}>Unknown tab type: {(tab as any).type}</div>;
  }
}
