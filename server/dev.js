import { spawn } from 'node:child_process'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const api = spawn(process.execPath, ['server/index.js'], { stdio: 'inherit', env: { ...process.env, PORT: '3001' } })
const vite = spawn(npmCommand, ['exec', 'vite', '--', '--host', '0.0.0.0'], { stdio: 'inherit', shell: true })

function shutdown() {
  api.kill()
  vite.kill()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
