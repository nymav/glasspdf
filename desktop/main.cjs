const { app, BrowserWindow, session, protocol, shell, dialog } = require('electron')
const path = require('node:path')
const fs = require('node:fs/promises')
protocol.registerSchemesAsPrivileged([{ scheme: 'glasspdf', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }])
app.enableSandbox()
app.commandLine.appendSwitch('disable-http-cache')
let window
const FEEDBACK = 'https://github.com/nymav/glasspdf/issues/new'
const RELEASES = 'https://github.com/nymav/glasspdf/releases'
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.webmanifest': 'application/manifest+json' }
async function createWindow() {
  // No persist: prefix: Chromium session data remains in memory.
  const privateSession = session.fromPartition('glasspdf-private', { cache: false })
  privateSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
  privateSession.setPermissionCheckHandler(() => false)
  privateSession.webRequest.onBeforeRequest((details, callback) => {
    const allowed = details.url.startsWith('glasspdf://app/') || details.url.startsWith('blob:glasspdf://app/') || details.url.startsWith('data:')
    callback({ cancel: !allowed })
  })
  const root = path.join(app.getAppPath(), 'dist-desktop')
  privateSession.protocol.handle('glasspdf', async request => {
    try {
      const url = new URL(request.url)
      if (url.host !== 'app' || request.method !== 'GET') return new Response(null, { status: 403 })
      const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html'
      const file = path.resolve(root, relative)
      if (!file.startsWith(root + path.sep)) return new Response(null, { status: 403 })
      const bytes = await fs.readFile(file)
      return new Response(bytes, { headers: {
        'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; connect-src 'self' blob:; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; form-action 'none'",
        'X-Content-Type-Options': 'nosniff',
      } })
    } catch { return new Response(null, { status: 404 }) }
  })
  window = new BrowserWindow({ width: 1440, height: 1000, minWidth: 360, minHeight: 600, title: 'GlassPDF', backgroundColor: '#f1f5f9', webPreferences: { session: privateSession, nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, spellcheck: false } })
  window.webContents.on('will-navigate', (event, url) => { if (!url.startsWith('glasspdf://app/')) event.preventDefault() })
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url === FEEDBACK || url === RELEASES) shell.openExternal(url)
    return { action: 'deny' }
  })
  window.webContents.on('will-prevent-unload', event => {
    const choice = dialog.showMessageBoxSync(window, { type: 'question', buttons: ['Keep working', 'Discard and close'], defaultId: 0, cancelId: 0, title: 'Undownloaded work', message: 'Your workspace or generated PDF has not been downloaded. Discard it?', detail: 'Original files and existing downloads will remain unchanged.' })
    if (choice === 1) event.preventDefault()
  })
  // Save only when the user explicitly requests Download. The native destination
  // dialog is separate from Chromium's private, in-memory workspace.
  privateSession.on('will-download', (_event, item) => { item.setSaveDialogOptions({ title: item.getFilename().endsWith('.txt') ? 'Save extracted text' : 'Save PDF', filters: item.getFilename().endsWith('.txt') ? [{ name: 'Text documents', extensions: ['txt'] }] : [{ name: 'PDF documents', extensions: ['pdf'] }] }) })
  await window.loadURL('glasspdf://app/')
}
app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit())
