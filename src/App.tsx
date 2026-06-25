import { useEffect } from 'react';
import AppLayout from './components/Layout/AppLayout';
import { initPlugins } from './plugins';
import { usePluginStore } from './plugins/pluginStore';
import { useTheme } from './hooks/useTheme';
import './App.css';

function App() {
  useTheme();
  useEffect(() => {
    initPlugins();
    // 插件注册后刷新 store 默认值，使 defaultVisible 等生效
    usePluginStore.getState().refreshDefaults();
  }, []);
  return <AppLayout />;
}

export default App;
