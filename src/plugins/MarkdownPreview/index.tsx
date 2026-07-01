import { useEffect, useState, useRef } from 'react';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { Marked } from 'marked';
import { useUiStore } from '../../stores/uiStore';
import { useFileStore } from '../../stores/fileStore';
import './MarkdownPreview.css';

const marked = new Marked({
  gfm: true,
  breaks: true,
});

export default function MarkdownPreview() {
  const selectedPaths = useUiStore((s) => s.selectedPaths);
  const entries = useFileStore((s) => s.entries);
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const selectedEntry =
    selectedPaths.size === 1
      ? entries.find((e) => e.path === Array.from(selectedPaths)[0])
      : undefined;

  const isMdFile =
    selectedEntry &&
    !selectedEntry.is_dir &&
    selectedEntry.extension.toLowerCase() === 'md';

  useEffect(() => {
    setHtml('');
    setError(null);
    if (!isMdFile) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const raw: string = await readTextFile(selectedEntry!.path);
        if (cancelled) return;
        const rendered = await marked.parse(raw);
        if (cancelled) return;
        setHtml(rendered);
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [selectedEntry?.path]);

  if (!selectedEntry) {
    return (
      <div className="md-preview md-preview--empty">
        <p>Select a file to preview</p>
      </div>
    );
  }

  if (!isMdFile) {
    return (
      <div className="md-preview md-preview--empty">
        <p>Select a <code>.md</code> file to preview</p>
      </div>
    );
  }

  return (
    <div className="md-preview">
      <div className="md-preview__header">{selectedEntry.name}</div>
      {loading && <div className="md-preview__loading">Loading...</div>}
      {error && <div className="md-preview__error">{error}</div>}
      {html && (
        <div
          ref={contentRef}
          className="md-preview__content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
