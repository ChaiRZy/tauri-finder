import { useState } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { useFileSystem } from '../../hooks/useFileSystem';
import './Dialog.css';

export default function CreateDialog() {
  const dialog = useUiStore((s) => s.dialog);
  const closeDialog = useUiStore((s) => s.closeDialog);
  const { createDirectory } = useFileSystem();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (!dialog || dialog.type !== 'create') return null;

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }
    try {
      await createDirectory(name.trim());
      closeDialog();
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="dialog-overlay" onClick={closeDialog}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">New Folder</div>
        <div className="dialog-body">
          <label className="dialog-label">Folder Name:</label>
          <input
            className="dialog-input"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') closeDialog(); }}
            autoFocus
            placeholder="Untitled Folder"
          />
          {error && <div className="dialog-error">{error}</div>}
        </div>
        <div className="dialog-footer">
          <button className="dialog-btn dialog-btn-cancel" onClick={closeDialog}>Cancel</button>
          <button className="dialog-btn dialog-btn-primary" onClick={handleSubmit}>Create</button>
        </div>
      </div>
    </div>
  );
}
