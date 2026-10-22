import { app, BrowserWindow, Tray, nativeImage, ipcMain, dialog, safeStorage } from 'electron'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { readFileSync } from 'node:fs'
import { KernelHost } from './kernel-host'
import { CredentialStore } from './credentials'
import { ModelVault } from './model-vault'
import { registerWorkflowBridge } from './workflow-bridge'
import { registerAppearance, setNativeMenus } from './appearance'

let window: BrowserWindow | undefined
let host: KernelHost | undefined
let tray: Tray | undefined
let quitting = false
let quitPending = false
let modelVault: ModelVault | undefined
const root = __dirname
const rendererUrl = pathToFileURL(join(root, 'renderer/index.html')).href
if (process.env.WEFTPILOT_TEST_DATA) app.setPath('userData', process.env.WEFTPILOT_TEST_DATA)
const ownsInstance = app.requestSingleInstanceLock()
if (!ownsInstance) app.quit()

const createWindow = (): void => {
  window = new BrowserWindow({
    width: 1140,
    height: 780,
    minWidth: 700,
    minHeight: 540,
    title: '纬舟 WeftPilot',
    backgroundColor: '#f7f7f5',
    webPreferences: {
      preload: join(root, 'preload.cjs'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })
  window.on('close', (event) => {
    if (!quitting) {
      event.preventDefault()
      window?.hide()
    }
  })
  void window.loadURL(rendererUrl)
}

const quit = async (): Promise<void> => {
  if (quitPending) return
  quitPending = true
  try {
    await host?.stop()
    quitting = true
    tray?.destroy()
    app.quit()
  } catch (error) {
    window?.show()
    await dialog.showMessageBox({
      type: 'error',
      title: '尚未完全退出',
      message: error instanceof Error ? error.message : '停止失败',
    })
  } finally {
    quitPending = false
  }
}

const diagnostics = async () => {
  if (!host) throw new Error('内核未启动')
  const handshake = await host.client.handshake()
  const lock = JSON.parse(readFileSync(join(root, 'kernel-lock.json'), 'utf8')) as {
    sourceCommit: string
    sha256: string
  }
  if (handshake.sourceCommit !== lock.sourceCommit) throw new Error('内核源提交与锁定版本不一致')
  return {
    handshake,
    artifactSha256: lock.sha256,
    credentialsAvailable: new CredentialStore(
      join(app.getPath('userData'), 'credentials'),
    ).available(),
  }
}

ipcMain.handle('weftpilot:diagnostics', async (event) => {
  if (
    event.sender !== window?.webContents ||
    event.senderFrame !== window.webContents.mainFrame ||
    event.senderFrame.url !== rendererUrl
  ) {
    throw new Error('不允许的 IPC 来源')
  }
  return diagnostics()
})

const nativeUi = { window: () => window, tray: () => tray, quit, rendererUrl }
registerAppearance(nativeUi)

registerWorkflowBridge({
  window: () => window,
  rendererUrl,
  vault: () => {
    if (!modelVault) throw new Error('CREDENTIAL_STORAGE_UNAVAILABLE')
    return modelVault
  },
  client: () => {
    if (!host) throw new Error('内核未启动')
    return host.client
  },
})

if (ownsInstance)
  void app
    .whenReady()
    .then(() => {
      modelVault = new ModelVault(join(app.getPath('userData'), 'credentials/models'), {
        available: () => safeStorage.isEncryptionAvailable(),
        encrypt: (value) => safeStorage.encryptString(value),
        decrypt: (value) => safeStorage.decryptString(value),
      })
      host = new KernelHost(root, join(app.getPath('userData'), 'kernel'), modelVault)
      createWindow()
      const image = nativeImage.createFromPath(join(root, 'renderer/brand/tray.png'))
      tray = new Tray(image.resize({ width: 20, height: 20 }))
      tray.setToolTip('纬舟 WeftPilot')
      tray.on('double-click', () => window?.show())
      setNativeMenus(nativeUi, 'zh-CN')
    })
    .catch(async (error: unknown) => {
      await dialog.showMessageBox({
        type: 'error',
        message: error instanceof Error ? error.message : '内核启动失败',
      })
      quitting = true
      app.quit()
    })

app.on('before-quit', (event) => {
  if (!quitting) {
    event.preventDefault()
    void quit()
  }
})
app.on('second-instance', () => window?.show())
app.on('activate', () => window?.show())
app.on('window-all-closed', () => {
  /* 窗口关闭后保留宿主与工具进程。 */
})
