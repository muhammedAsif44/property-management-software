const { execSync } = require('child_process');

const ports = [3000, 3001, 4000];

for (const port of ports) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' });
      const lines = output.split('\n').filter((l) => l.includes('LISTENING'));
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0' && pid !== String(process.pid)) {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            console.log(`[free-ports] Freed port ${port} (PID ${pid})`);
          } catch {}
        }
      }
    }
  } catch {}
}
