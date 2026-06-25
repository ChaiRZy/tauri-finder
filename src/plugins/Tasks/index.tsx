import { useState } from 'react';

/**
 * 底部任务面板插件：文件操作任务进度
 */
export default function TasksPanel() {
  const [tasks] = useState<{ name: string; status: string }[]>([
    { name: 'Idle', status: 'ready' },
  ]);

  return (
    <div style={{ padding: '6px 10px', fontSize: 12, fontFamily: 'monospace', height: '100%', overflowY: 'auto', background: '#1e1e1e', color: '#d4d4d4' }}>
      <div style={{ color: '#888', marginBottom: 4 }}>Tasks</div>
      {tasks.map((t, i) => (
        <div key={i} style={{ color: t.status === 'running' ? '#4FC1FF' : '#6e7681' }}>
          {t.status === 'running' ? '▶' : '○'} {t.name}
        </div>
      ))}
    </div>
  );
}
