/**
 * 在启动 Vite dev server 前清理残留进程
 * 防止 port 1420 被上次未关闭的 dev server 占用
 */
const { execSync } = require('child_process');
const os = require('os');

try {
  let pid = null;
  if (os.platform() === 'win32') {
    const out = execSync('netstat -ano | findstr :1420 | findstr LISTENING', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const match = out.trim().match(/(\d+)$/m);
    if (match) pid = parseInt(match[1]);
  } else {
    try {
      pid = parseInt(execSync('lsof -ti:1420', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim());
    } catch {}
  }
  if (pid) {
    process.kill(pid);
    console.log(`[dev] Killed old dev server (PID ${pid})`);
  }
} catch {}
