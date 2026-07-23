/**
 * Frees the backend listen port (default 5000) if another process is holding it.
 * Usage: npm run free-port
 */
const { execSync } = require('child_process');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const port = Number(process.env.PORT) || 5000;

function uniquePidsFromNetstat(port) {
  const out = execSync('netstat -ano', { encoding: 'utf8' });
  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    if (!line.includes(`:${port}`) || !/LISTENING/i.test(line)) continue;
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (/^\d+$/.test(pid) && pid !== '0') pids.add(pid);
  }
  return [...pids];
}

function uniquePidsFromLsof(port) {
  try {
    const out = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN`, {
      encoding: 'utf8',
    }).trim();
    if (!out) return [];
    return out.split(/\s+/).filter(Boolean);
  } catch {
    return [];
  }
}

function freePort(port) {
  const pids =
    process.platform === 'win32'
      ? uniquePidsFromNetstat(port)
      : uniquePidsFromLsof(port);

  if (pids.length === 0) {
    console.log(`Port ${port} is already free.`);
    return;
  }

  console.log(`Port ${port} is in use by PID(s): ${pids.join(', ')}`);
  for (const pid of pids) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
      } else {
        execSync(`kill -9 ${pid}`, { stdio: 'inherit' });
      }
      console.log(`Stopped PID ${pid}`);
    } catch (err) {
      console.error(`Could not stop PID ${pid}: ${err.message}`);
    }
  }
}

freePort(port);
