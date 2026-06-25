import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useUiStore } from '../../stores/uiStore';

/**
 * HTML 实时预览插件
 * 选中 .html 文件后在右侧以 iframe 渲染预览
 */
export default function HtmlPreview() {
  const selectedPaths = useUiStore((s) => s.selectedPaths);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const selArray = Array.from(selectedPaths);
  const targetFile = selArray.length === 1 && selArray[0].endsWith('.html') ? selArray[0] : null;

  useEffect(() => {
    if (!targetFile) {
      setError(null);
      setLoading(false);
      if (blobUrl) { URL.revokeObjectURL(blobUrl); setBlobUrl(null); }
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const content: string = await invoke('read_text_file', { path: targetFile });
        if (cancelled) return;
        const blob = new Blob([content], { type: 'text/html; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        setBlobUrl(url);
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [targetFile]);

  // 清理 blob URL
  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, []);

  if (!targetFile) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#999', fontSize: 12 }}>
        选中一个 .html 文件以预览
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>加载中...</div>;
  }

  if (error) {
    return <div style={{ padding: 20, color: '#e74c3c', fontSize: 12 }}>{error}</div>;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '6px 10px', fontSize: 11, color: '#666', borderBottom: '1px solid #e8e8e8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {targetFile.split(/[/\\]/).pop()}
      </div>
      {blobUrl && (
        <iframe
          ref={iframeRef}
          src={blobUrl}
          style={{ flex: 1, border: 'none', width: '100%' }}
          title="HTML Preview"
          sandbox="allow-scripts"
        />
      )}
    </div>
  );
}
