import { useState } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { useFileSystem } from '../../hooks/useFileSystem';
import './Dialog.css';

export default function RenameDialog() {
  const dialog = useUiStore((s) => s.dialog);
  const closeDialog = useUiStore((s) => s.closeDialog);
  const { renameItem } = useFileSystem();
  const entry = dialog?.entry;
  const [name, setName] = useState(entry?.name || '');
  const [error, setError] = useState('');

  if (!dialog || dialog.type !== 'rename' || !entry) return null;

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }
    if (name.trim() === entry.name) {
      closeDialog();
      return;
    }
    try {
      await renameItem(entry.path, name.trim());
      closeDialog();
    } catch (e) {
      setError(String(e));
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const dotIdx = entry.name.lastIndexOf('.');
    if (dotIdx > 0 && !entry.is_dir) {
      e.target.setSelectionRange(0, dotIdx);
    }
  };

  return (
    <div className="dialog-overlay" onClick={closeDialog}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">Rename</div>
        <div className="dialog-body">
          <label className="dialog-label">New Name:</label>
          <input
            className="dialog-input"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') closeDialog(); }}
            onFocus={handleFocus}
            autoFocus
          />
          {error && <div className="dialog-error">{error}</div>}
        </div>
        <div className="dialog-footer">
          <button className="dialog-btn dialog-btn-cancel" onClick={closeDialog}>Cancel</button>
          <button className="dialog-btn dialog-btn-primary" onClick={handleSubmit}>Rename</button>
        </div>
      </div>
    </div>
  );
}
