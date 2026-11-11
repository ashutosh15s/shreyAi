const fs = require('node:fs')
const path = require('node:path')

// A skipped Electron download otherwise makes electron-vite fail at startup.
delete process.env.ELECTRON_SKIP_BINARY_DOWNLOAD

const electronDir = path.dirname(require.resolve('electron/package.json'))
const pathFile = path.join(electronDir, 'path.txt')

require(path.join(electronDir, 'install.js'))

process.once('beforeExit', () => {
  if (!fs.existsSync(pathFile)) {
    console.error('Electron installer finished without creating path.txt.')
    process.exitCode = 1
    return
  }

  const relativeBinary = fs.readFileSync(pathFile, 'utf8').trim()
  const distDir = process.env.ELECTRON_OVERRIDE_DIST_PATH || path.join(electronDir, 'dist')
  const binaryPath = path.join(distDir, relativeBinary)

  if (!fs.existsSync(binaryPath)) {
    console.error(`Electron installer did not create its binary: ${binaryPath}`)
    process.exitCode = 1
  }
})
