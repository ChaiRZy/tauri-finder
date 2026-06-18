import { useUiStore } from '../../stores/uiStore';
import { useFileStore } from '../../stores/fileStore';
import { useFileSystem } from '../../hooks/useFileSystem';
import { Settings, FolderPlus, FilePenLine, Trash2, Copy, Scissors, ClipboardPaste, Info, Tags, ExternalLink, FolderDown } from 'lucide-react';
import type { ContextMenuItemId } from '../../types/file';
import './ContextMenu.css';

export default function ContextMenu() {
  const contextMenu = useUiStore((s) => s.contextMenu);
  const hideContextMenu = useUiStore((s) => s.hideContextMenu);
  const selectedPaths = useUiStore((s) => s.selectedPaths);
  const openDialog = useUiStore((s) => s.openDialog);
  const setClipboard = useUiStore((s) => s.setClipboard);
  const clipboard = useUiStore((s) => s.clipboard);
  const currentDir = useFileStore((s) => s.currentDir);
  const menuConfig = useUiStore((s) => s.contextMenuConfig);
  const { deleteItem, copyItems, moveItems } = useFileSystem();
  const addTab = useFileStore((s) => s.addTab);

  if (!contextMenu) return null;

  const hasSelection = contextMenu.entries.length > 0 && selectedPaths.size > 0;
  const singleFile = contextMenu.entries.length === 1;
  const entry = contextMenu.entries[0];
  const enabled = menuConfig.items;

  const style: React.CSSProperties = {
    position: 'fixed',
    left: contextMenu.x,
    top: contextMenu.y,
    zIndex: 1000,
  };

  const handleAction = (action: () => void) => {
    action();
    hideContextMenu();
  };

  const renderItem = (id: ContextMenuItemId) => {
    switch (id) {
      case 'rename':
        return hasSelection && singleFile ? (
          <div key="rename" className="context-menu-item" onClick={() => handleAction(() => {
            openDialog({ type: 'rename', entry, parentPath: currentDir });
          })}>
            <FilePenLine size={14} />
            <span>Rename</span>
          </div>
        ) : null;
      case 'copy':
        return hasSelection ? (
          <div key="copy" className="context-menu-item" onClick={() => handleAction(() => {
            setClipboard('copy', Array.from(selectedPaths));
          })}>
            <Copy size={14} />
            <span>Copy</span>
          </div>
        ) : null;
      case 'cut':
        return hasSelection ? (
          <div key="cut" className="context-menu-item" onClick={() => handleAction(() => {
            setClipboard('cut', Array.from(selectedPaths));
          })}>
            <Scissors size={14} />
            <span>Cut</span>
          </div>
        ) : null;
      case 'delete':
        return hasSelection ? (
          <div key="delete" className="context-menu-item" onClick={() => handleAction(async () => {
            for (const path of Array.from(selectedPaths)) {
              await deleteItem(path);
            }
          })}>
            <Trash2 size={14} />
            <span>Delete</span>
          </div>
        ) : null;
      case 'getInfo':
        return hasSelection && singleFile && entry ? (
          <div key="getInfo" className="context-menu-item" onClick={() => handleAction(() => {
            openDialog({ type: 'properties', entry, parentPath: currentDir });
          })}>
            <Info size={14} />
            <span>Get Info</span>
          </div>
        ) : null;
      case 'newFolder':
        return currentDir ? (
          <div key="newFolder" className="context-menu-item" onClick={() => handleAction(() => {
            openDialog({ type: 'create', parentPath: currentDir });
          })}>
            <FolderPlus size={14} />
            <span>New Folder</span>
          </div>
        ) : null;
      case 'paste':
        return clipboard.mode && currentDir ? (
          <div key="paste" className="context-menu-item" onClick={() => handleAction(async () => {
            if (clipboard.mode === 'copy') {
              await copyItems(clipboard.sources, currentDir);
            } else {
              await moveItems(clipboard.sources);
            }
            useUiStore.getState().clearClipboard();
          })}>
            <ClipboardPaste size={14} />
            <span>Paste {clipboard.sources.length} item{clipboard.sources.length > 1 ? 's' : ''}</span>
          </div>
        ) : null;
    }
  };

  const visibleItems = (
    ['rename', 'copy', 'cut', 'delete', 'getInfo'] as ContextMenuItemId[]
  ).filter(id => enabled[id] && renderItem(id));

  const alwaysItems = (
    ['newFolder', 'paste'] as ContextMenuItemId[]
  ).filter(id => enabled[id] && renderItem(id));

  return (
    <div className="context-menu" style={style} onClick={(e) => e.stopPropagation()}>
      {visibleItems.map(id => renderItem(id))}
      {visibleItems.length > 0 && alwaysItems.length > 0 && <div className="context-menu-separator" />}
      {alwaysItems.map(id => renderItem(id))}

      {/* Folder-specific actions */}
      {hasSelection && singleFile && entry?.is_dir && (
        <>
          <div className="context-menu-separator" />
          {clipboard.mode && (
            <div className="context-menu-item" onClick={() => handleAction(async () => {
              if (clipboard.mode === 'copy') {
                await copyItems(clipboard.sources, entry.path);
              } else {
                await moveItems(clipboard.sources, entry.path);
              }
              useUiStore.getState().clearClipboard();
            })}>
              <FolderDown size={14} />
              <span>Paste into {entry.name}</span>
            </div>
          )}
            <div className="context-menu-item" onClick={() => handleAction(() => {
            addTab(entry.path);
          })}>
            <ExternalLink size={14} />
            <span>Open in New Tab</span>
          </div>
          <div className="context-menu-item" onClick={() => handleAction(() => {
            openDialog({ type: 'tagManager', parentPath: entry.path });
          })}>
            <Tags size={14} />
            <span>Tags...</span>
          </div>
        </>
      )}

      <div className="context-menu-separator" />
      <div className="context-menu-item" onClick={() => handleAction(() => {
        openDialog({ type: 'contextMenuSettings' });
      })}>
        <Settings size={14} />
        <span>Customize Menu...</span>
      </div>
      <div className="context-menu-item" onClick={() => handleAction(() => {
        openDialog({ type: 'tagManager' });
      })}>
        <Tags size={14} />
        <span>Tag Manager...</span>
      </div>
    </div>
  );
}
