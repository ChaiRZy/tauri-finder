import { useUiStore } from '../../stores/uiStore';
import FileIcon from '../FileList/FileIcon';
import { formatSize, formatDate, getFileType } from '../../utils/formatters';
import './Dialog.css';

export default function PropertiesDialog() {
  const dialog = useUiStore((s) => s.dialog);
  const closeDialog = useUiStore((s) => s.closeDialog);
  const entry = dialog?.entry;

  if (!dialog || dialog.type !== 'properties' || !entry) return null;

  return (
    <div className="dialog-overlay" onClick={closeDialog}>
      <div className="dialog dialog-wide" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">Info: {entry.name}</div>
        <div className="dialog-body">
          <div className="props-icon-area">
            <FileIcon entry={entry} size={48} />
          </div>
          <div className="props-info">
            <div className="props-row">
              <span className="props-label">Name</span>
              <span className="props-value">{entry.name}</span>
            </div>
            <div className="props-row">
              <span className="props-label">Kind</span>
              <span className="props-value">{getFileType(entry)}</span>
            </div>
            <div className="props-row">
              <span className="props-label">Size</span>
              <span className="props-value">{formatSize(entry.size)}</span>
            </div>
            <div className="props-row">
              <span className="props-label">Path</span>
              <span className="props-value path-value">{entry.path}</span>
            </div>
            <div className="props-row">
              <span className="props-label">Modified</span>
              <span className="props-value">{formatDate(entry.modified_at)}</span>
            </div>
            <div className="props-row">
              <span className="props-label">Created</span>
              <span className="props-value">{formatDate(entry.created_at)}</span>
            </div>
            <div className="props-row">
              <span className="props-label">Extension</span>
              <span className="props-value">{entry.extension || '--'}</span>
            </div>
            <div className="props-row">
              <span className="props-label">MIME Type</span>
              <span className="props-value">{entry.mime_type}</span>
            </div>
          </div>
        </div>
        <div className="dialog-footer">
          <button className="dialog-btn dialog-btn-primary" onClick={closeDialog}>Close</button>
        </div>
      </div>
    </div>
  );
}
