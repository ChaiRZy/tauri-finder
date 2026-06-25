import { useEffect, useState } from 'react';
import { on, EVENT_FILE_SELECTION } from '../eventBus';

/**
 * 底部输出面板插件：显示操作日志/搜索结果
 */
export default function OutputPlugin() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const unsub = on(EVENT_FILE_SELECTION, (data: any) => {
      const count = data?.selectedPaths?.length ?? 0;
      if (count > 0) {
        setLogs((prev) => [...prev.slice(-99), `[${new Date().toLocaleTimeString()}] 选中 ${count} 个文件`]);
      }
    });
    return unsub;
  }, []);

  return (
    <div style={{ padding: '6px 10px', fontSize: 12, fontFamily: 'monospace', height: '100%', overflowY: 'auto', background: '#1e1e1e', color: '#d4d4d4' }}>
      <div style={{ color: '#888', marginBottom: 4 }}>Output</div>
      {logs.length === 0 && <div style={{ color: '#555' }}>No output yet</div>}
      {logs.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}
