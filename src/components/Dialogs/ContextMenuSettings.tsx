import { useUiStore } from '../../stores/uiStore';
import type { ContextMenuItemId } from '../../types/file';
import './Dialog.css';

const LABELS: Record<ContextMenuItemId, string> = {
  rename: 'Rename',
  copy: 'Copy',
  cut: 'Cut',
  delete: 'Delete',
  getInfo: 'Get Info',
  newFolder: 'New Folder',
  paste: 'Paste',
};

const ALL_ITEMS: ContextMenuItemId[] = ['rename', 'copy', 'cut', 'delete', 'getInfo', 'newFolder', 'paste'];

export default function ContextMenuSettings() {
  const dialog = useUiStore((s) => s.dialog);
  const closeDialog = useUiStore((s) => s.closeDialog);
  const menuConfig = useUiStore((s) => s.contextMenuConfig);
  const toggleContextMenuItem = useUiStore((s) => s.toggleContextMenuItem);

  if (!dialog || dialog.type !== 'contextMenuSettings') return null;

  return (
    <div className="dialog-overlay" onClick={closeDialog}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">Customize Context Menu</div>
        <div className="dialog-body">
          <label className="dialog-label">Select which items appear in the right-click menu:</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {ALL_ITEMS.map((id) => (
              <label
                key={id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
              >
                <input
                  type="checkbox"
                  checked={menuConfig.items[id]}
                  onChange={() => toggleContextMenuItem(id)}
                />
                {LABELS[id]}
              </label>
            ))}
          </div>
        </div>
        <div className="dialog-footer">
          <button className="dialog-btn dialog-btn-primary" onClick={closeDialog}>Done</button>
        </div>
      </div>
    </div>
  );
}
