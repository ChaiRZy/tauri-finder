import { useFileStore } from '../../stores/fileStore';
import { useGitStatus } from '../../hooks/useGitStatus';

const STATUS_LABELS: Record<string, string> = {
  staged: 'Staged',
  modified: 'Modified',
  untracked: 'Untracked',
  deleted: 'Deleted',
  renamed: 'Renamed',
  conflict: 'Conflict',
  unknown: 'Unknown',
};

const STATUS_COLORS: Record<string, string> = {
  staged: '#2ea043',
  modified: '#d29922',
  untracked: '#58a6ff',
  deleted: '#da3633',
  renamed: '#bc8cff',
  conflict: '#f0883e',
  unknown: '#8b949e',
};

export default function GitStatusPlugin() {
  const currentDir = useFileStore((s) => s.currentDir);
  const { gitStatus, loading } = useGitStatus(currentDir);

  const statusList: { path: string; status: string; staged: boolean }[] = [];
  for (const filePath of Object.keys(gitStatus)) {
    const info = gitStatus[filePath];
    statusList.push({ path: filePath, status: info.status, staged: info.staged });
  }

  const counts: Record<string, number> = {};
  for (const item of statusList) {
    counts[item.status] = (counts[item.status] || 0) + 1;
  }
  const hasData = statusList.length > 0;

  return (
    <div style={{
      padding: 8, fontSize: 12, height: '100%', display: 'flex', flexDirection: 'column',
      background: '#0d1117', color: '#c9d1d9',
    }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#e6edf3' }}>
        Git Status
      </div>

      {loading && <div style={{ color: '#8b949e' }}>Loading...</div>}

      {!loading && !hasData && (
        <div style={{ color: '#8b949e', textAlign: 'center', padding: '20px 0' }}>
          No changes
        </div>
      )}

      {hasData && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {Object.entries(counts).map(([status, count]) => (
              <span
                key={status}
                style={{
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontSize: 11,
                  background: STATUS_COLORS[status] + '22',
                  color: STATUS_COLORS[status],
                  border: `1px solid ${STATUS_COLORS[status]}44`,
                }}
              >
                {STATUS_LABELS[status] ?? status}: {count}
              </span>
            ))}
          </div>

          <div style={{
            flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: 11,
            borderTop: '1px solid #21262d',
          }}>
            {statusList.map((item) => (
              <div
                key={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 4px',
                  borderBottom: '1px solid #21262d',
                }}
              >
                <span
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: STATUS_COLORS[item.status] ?? '#8b949e',
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: '#8b949e', width: 32, flexShrink: 0 }}>
                  {STATUS_LABELS[item.status]?.slice(0, 3) ?? '???'}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.path}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
