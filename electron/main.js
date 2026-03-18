const { app, BrowserWindow, shell, Menu, nativeTheme } = require('electron')
const path = require('path')

// Force dark mode to match the app's dark theme
nativeTheme.themeSource = 'dark'

const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_DEV === '1'
const PORT = process.env.PORT || 3000

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'AgentBoard',
    backgroundColor: '#0a0a0a',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false, // Don't show until ready to avoid white flash
    icon: path.join(__dirname, '../public/icons/icon.png'),
  })

  // Show window when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' })
  })

  // Load the Next.js app
  const url = isDev
    ? `http://localhost:${PORT}`
    : `http://localhost:${PORT}`

  mainWindow.loadURL(url).catch(() => {
    // If Next.js isn't ready yet, retry after a short delay
    setTimeout(() => mainWindow?.loadURL(url), 1000)
  })

  // Open external links in the system browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Remove default menu on Windows/Linux for cleaner look
function buildMenu() {
  if (process.platform === 'darwin') {
    // Keep default macOS menu for proper Mac behavior
    const template = [
      {
        label: app.name,
        submenu: [
          { role: 'about', label: 'About AgentBoard' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' },
        ],
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
        ],
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' },
          { type: 'separator' },
          { role: 'front' },
        ],
      },
    ]
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
  } else {
    // Minimal menu on Windows/Linux
    Menu.setApplicationMenu(null)
  }
}

app.whenReady().then(() => {
  buildMenu()
  createWindow()

  app.on('activate', () => {
    // macOS: re-create window when dock icon is clicked and no windows are open
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  // On macOS, keep app running when all windows are closed (standard Mac behavior)
  if (process.platform !== 'darwin') app.quit()
})

// Security: prevent new windows from being created
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    // Allow navigation to localhost (the Next.js app)
    if (parsedUrl.hostname !== 'localhost' && parsedUrl.hostname !== '127.0.0.1') {
      event.preventDefault()
      shell.openExternal(navigationUrl)
    }
  })
})
