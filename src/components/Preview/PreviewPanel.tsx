import { useEffect, useState } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { useFileStore } from '../../stores/fileStore';
import { useFileSystem } from '../../hooks/useFileSystem';
import FileIcon from '../FileList/FileIcon';
import { formatSize, formatDate, getFileType, isImageExtension, isTextExtension } from '../../utils/formatters';
import type { FileEntry } from '../../types/file';
import './PreviewPanel.css';

export default function PreviewPanel() {
  const selectedPaths = useUiStore((s) => s.selectedPaths);
  const entries = useFileStore((s) => s.entries);
  const { readTextFile } = useFileSystem();

  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedEntry: FileEntry | undefined =
    selectedPaths.size === 1
      ? entries.find((e) => e.path === Array.from(selectedPaths)[0])
      : undefined;

  useEffect(() => {
    setPreviewContent(null);
    if (!selectedEntry) return;

    const ext = selectedEntry.extension.toLowerCase();

    if (isImageExtension(ext) && !selectedEntry.is_dir) {
      // For image files, we can use a file:// URL
      const fileUrl = `file://${selectedEntry.path.replace(/\\/g, '/')}`;
      setPreviewContent(`<img src="${fileUrl}" alt="${selectedEntry.name}" style="max-width:100%;max-height:100%;object-fit:contain" />`);
    } else if (isTextExtension(ext) && !selectedEntry.is_dir) {
      setLoading(true);
      readTextFile(selectedEntry.path)
        .then((text) => setPreviewContent(`<pre style="white-space:pre-wrap;font-size:12px;margin:0">${escapeHtml(text)}</pre>`))
        .catch(() => setPreviewContent('<div style="color:#999">Unable to preview</div>'))
        .finally(() => setLoading(false));
    }
  }, [selectedEntry]);

  if (!selectedEntry) {
    return (
      <div className="preview-empty">
        <FileIcon entry={{ is_dir: false, extension: '', mime_type: '' }} size={48} />
        <p>No file selected</p>
      </div>
    );
  }

  return (
    <div className="preview-panel">
      <div className="preview-header">{selectedEntry.name}</div>

      <div className="preview-icon-area">
        <FileIcon entry={selectedEntry} size={64} />
      </div>

      <div className="preview-info">
        <div className="preview-info-row">
          <span className="preview-label">Kind</span>
          <span className="preview-value">{getFileType(selectedEntry)}</span>
        </div>
        <div className="preview-info-row">
          <span className="preview-label">Size</span>
          <span className="preview-value">{formatSize(selectedEntry.size)}</span>
        </div>
        <div className="preview-info-row">
          <span className="preview-label">Modified</span>
          <span className="preview-value">{formatDate(selectedEntry.modified_at)}</span>
        </div>
        <div className="preview-info-row">
          <span className="preview-label">Created</span>
          <span className="preview-value">{formatDate(selectedEntry.created_at)}</span>
        </div>
        <div className="preview-info-row">
          <span className="preview-label">Path</span>
          <span className="preview-value path-value">{selectedEntry.path}</span>
        </div>
      </div>

      {previewContent && (
        <div className="preview-content">
          <div className="preview-content-title">Preview</div>
          <div
            className="preview-content-body"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
        </div>
      )}

      {loading && <div className="preview-loading">Loading preview...</div>}
    </div>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
