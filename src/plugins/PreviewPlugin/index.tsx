import PreviewPanel from '../../components/Preview/PreviewPanel';
import { on, EVENT_FILE_SELECTION } from '../eventBus';
import { useEffect } from 'react';

/**
 * PreviewPanel 的插件包装
 * 作为 right 位置插件注册，通过事件总线监听文件选中变化
 */
export default function PreviewPlugin() {
  useEffect(() => {
    const unsub = on(EVENT_FILE_SELECTION, () => {
      // PreviewPanel 内部已通过 useUiStore.selectedPaths 响应，
      // 这里预留未来可能需要的额外逻辑
    });
    return unsub;
  }, []);

  return <PreviewPanel />;
}
