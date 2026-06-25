import { useEffect, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useUiStore } from '../../stores/uiStore';
import { useFileStore } from '../../stores/fileStore';
import { useFileSystem } from '../../hooks/useFileSystem';
import FileIcon from '../FileList/FileIcon';
import {
  formatSize, formatDate, getFileType,
  isImageExtension, isTextExtension, isVideoExtension, isAudioExtension,
  isPdfExtension, isJsonExtension, isBinaryExtension,
} from '../../utils/formatters';
import type { FileEntry } from '../../types/file';
import './PreviewPanel.css';

export default function PreviewPanel() {
  const selectedPaths = useUiStore((s) => s.selectedPaths);
  const entries = useFileStore((s) => s.entries);
  const { readTextFile } = useFileSystem();

  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bypassLargeFile, setBypassLargeFile] = useState(false);

  const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024;

  const selectedEntry: FileEntry | undefined =
    selectedPaths.size === 1
      ? entries.find((e) => e.path === Array.from(selectedPaths)[0])
      : undefined;

  useEffect(() => {
    setPreviewContent(null);
    setBypassLargeFile(false);
    if (!selectedEntry) return;

    const ext = selectedEntry.extension.toLowerCase();
    const isLarge = selectedEntry.size > LARGE_FILE_THRESHOLD;
    const fileUrl = `file://${selectedEntry.path.replace(/\\/g, '/')}`;

    if (isImageExtension(ext) && !selectedEntry.is_dir) {
      setPreviewContent(`<img src="${fileUrl}" alt="${selectedEntry.name}" style="max-width:100%;max-height:100%;object-fit:contain" />`);
    } else if (isVideoExtension(ext) && !selectedEntry.is_dir) {
      setPreviewContent(`<video class="preview-media" controls><source src="${fileUrl}"></video>`);
    } else if (isAudioExtension(ext) && !selectedEntry.is_dir) {
      setPreviewContent(`<audio class="preview-audio" controls src="${fileUrl}"></audio>`);
    } else if (isPdfExtension(ext) && !selectedEntry.is_dir) {
      setPreviewContent(`<iframe class="preview-embed" src="${fileUrl}"></iframe>`);
    } else if (isJsonExtension(ext) && !selectedEntry.is_dir && !isLarge) {
      setLoading(true);
      (async () => {
        try {
          const text = await readTextFile(selectedEntry.path);
          const parsed = JSON.parse(text);
          setPreviewContent(`<div class="json-tree">${renderJsonTree(parsed)}</div>`);
        } catch {
          setPreviewContent('<div style="color:#999">Unable to parse JSON</div>');
        }
        setLoading(false);
      })();
    } else if (isTextExtension(ext) && !selectedEntry.is_dir) {
      setLoading(true);
      (async () => {
        try {
          const html: string | null = await invoke('highlight_file', { path: selectedEntry.path });
          if (html) {
            setPreviewContent(`<div class="hl-code">${html}</div>`);
          } else {
            const text = await readTextFile(selectedEntry.path);
            setPreviewContent(`<pre style="white-space:pre-wrap;font-size:12px;margin:0">${escapeHtml(text)}</pre>`);
          }
        } catch {
          try {
            const text = await readTextFile(selectedEntry.path);
            setPreviewContent(`<pre style="white-space:pre-wrap;font-size:12px;margin:0">${escapeHtml(text)}</pre>`);
          } catch {
            setPreviewContent('<div style="color:#999">Unable to preview</div>');
          }
        }
        setLoading(false);
      })();
    } else if (isLarge && !bypassLargeFile) {
      setPreviewContent(null);
    } else if (isBinaryExtension(ext) && !selectedEntry.is_dir) {
      setLoading(true);
      (async () => {
        try {
          const bytes: number[] = await invoke('read_file_bytes', { path: selectedEntry.path, maxBytes: 512 });
          setPreviewContent(`<div class="hex-dump">${formatHexDump(bytes)}</div>`);
        } catch {
          setPreviewContent('<div style="color:#999">Unable to read file</div>');
        }
        setLoading(false);
      })();
    }
  }, [selectedEntry, bypassLargeFile]);

  const handleLoadLargeFile = useCallback(() => {
    setBypassLargeFile(true);
  }, []);

  if (!selectedEntry) {
    return (
      <div className="preview-empty">
        <FileIcon entry={{ is_dir: false, extension: '', mime_type: '' }} size={48} />
        <p>No file selected</p>
      </div>
    );
  }

  const isLarge = selectedEntry.size > LARGE_FILE_THRESHOLD && !bypassLargeFile;

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

      {isLarge && (
        <div className="preview-large-warning">
          File is larger than 10 MB. Preview may be slow.
          <br />
          <button onClick={handleLoadLargeFile}>Load anyway</button>
        </div>
      )}

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

function renderJsonTree(value: unknown, depth = 0): string {
  const indent = '  '.repeat(depth + 1);
  const indentEnd = '  '.repeat(depth);

  if (value === null) return '<span class="json-null">null</span>';
  if (typeof value === 'string') return `<span class="json-string">${escapeHtml(value)}</span>`;
  if (typeof value === 'number') return `<span class="json-number">${value}</span>`;
  if (typeof value === 'boolean') return `<span class="json-boolean">${value}</span>`;

  if (Array.isArray(value)) {
    if (value.length === 0) return '<span class="json-bracket">[ ]</span>';
    const items = value.map((v) => `${indent}${renderJsonTree(v, depth + 1)}`).join(',\n');
    return `<span class="json-bracket">[</span>\n${items}\n${indentEnd}<span class="json-bracket">]</span>`;
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>);
    if (keys.length === 0) return '<span class="json-bracket">{ }</span>';
    const items = keys.map((k) => {
      const v = (value as Record<string, unknown>)[k];
      return `${indent}<span class="json-key">"${escapeHtml(k)}"</span>: ${renderJsonTree(v, depth + 1)}`;
    }).join(',\n');
    return `<span class="json-bracket">{</span>\n${items}\n${indentEnd}<span class="json-bracket">}</span>`;
  }

  return String(value);
}

function formatHexDump(bytes: number[]): string {
  let result = '';
  for (let offset = 0; offset < bytes.length; offset += 16) {
    const hex = bytes.slice(offset, offset + 16)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
    const ascii = bytes.slice(offset, offset + 16)
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
      .join('');
    result += `<span class="hex-offset">${offset.toString(16).padStart(8, '0')}</span>`;
    result += `<span class="hex-bytes">${hex.padEnd(48)}</span>`;
    result += `<span class="hex-ascii">${ascii}</span>\n`;
  }
  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
