import { useState, useCallback } from 'react';
import { typedInvoke } from '../../utils/invoke';
import type { DiffLine } from '../../bindings';
import { useUiStore } from '../../stores/uiStore';
import { useFileStore } from '../../stores/fileStore';

/**
 * Diff 对比插件
 * 选中两个文件后自动触发对比，以右侧面板展示
 */
export default function DiffViewer() {
  const selectedPaths = useUiStore((s) => s.selectedPaths);
  const entries = useFileStore((s) => s.entries);

  const [diff, setDiff] = useState<DiffLine[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selArray = Array.from(selectedPaths);
  const twoSelected = selArray.length === 2;
  const fileA = twoSelected ? selArray[0] : null;
  const fileB = twoSelected ? selArray[1] : null;

  const nameA = fileA ? fileA.split(/[/\\]/).pop() || fileA : '';
  const nameB = fileB ? fileB.split(/[/\\]/).pop() || fileB : '';

  const runDiff = useCallback(async () => {
    if (!fileA || !fileB) return;
    setLoading(true);
    setError(null);
    try {
      const result: DiffLine[] = await typedInvoke.diffFiles(fileA, fileB);
      setDiff(result);
    } catch (e) {
      setError(String(e));
      setDiff(null);
    }
    setLoading(false);
  }, [fileA, fileB]);

  const fileEntryA = fileA ? entries.find((e) => e.path === fileA) : null;
  const fileEntryB = fileB ? entries.find((e) => e.path === fileB) : null;
  const bothText = fileEntryA && fileEntryB && !fileEntryA.is_dir && !fileEntryB.is_dir;

  return (
    <div style={{ padding: 12, fontSize: 12, height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontWeight: 600, fontSize: 13 }}>Diff Viewer</div>

      {/* 文件选择提示 */}
      {!twoSelected && (
        <div style={{ color: '#999', padding: '20px 0', textAlign: 'center' }}>
          Select two files to compare
        </div>
      )}

      {twoSelected && !bothText && (
        <div style={{ color: '#e74c3c', fontSize: 11 }}>
          Cannot diff: both selections must be text files
        </div>
      )}

      {twoSelected && bothText && (
        <>
          <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#d73a49' }}>{nameA}</span>
            <span style={{ color: '#999' }}>⟷</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#22863a' }}>{nameB}</span>
          </div>
          <button
            onClick={runDiff}
            disabled={loading}
            style={{
              padding: '4px 12px', fontSize: 12, cursor: 'pointer',
              border: '1px solid #ccc', borderRadius: 4, background: '#f5f5f5',
            }}
          >
            {loading ? 'Diffing...' : diff ? 'Re-run Diff' : 'Run Diff'}
          </button>

          {error && <div style={{ color: '#e74c3c', fontSize: 11 }}>{error}</div>}

          {/* Diff results */}
          {diff && (
            <div style={{
              flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: 11,
              border: '1px solid #e5e5e5', borderRadius: 4, background: '#fafafa',
            }}>
              {diff.map((line, i) => {
                const bg = line.tag === 'insert' ? '#e6ffed' : line.tag === 'delete' ? '#ffeef0' : 'transparent';
                const prefix = line.tag === 'insert' ? '+' : line.tag === 'delete' ? '-' : ' ';
                const color = line.tag === 'insert' ? '#22863a' : line.tag === 'delete' ? '#d73a49' : '#333';
                return (
                  <div key={i} style={{ display: 'flex', background: bg, padding: '0 4px' }}>
                    <span style={{ color: '#999', width: 30, textAlign: 'right', marginRight: 8, flexShrink: 0 }}>
                      {line.line_a ?? ''}
                    </span>
                    <span style={{ color: '#999', width: 30, textAlign: 'right', marginRight: 8, flexShrink: 0 }}>
                      {line.line_b ?? ''}
                    </span>
                    <span style={{ color, flex: 1, whiteSpace: 'pre' }}>{prefix} {line.content}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
