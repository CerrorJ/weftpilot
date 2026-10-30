import { app, BrowserWindow, Tray, nativeImage, ipcMain, dialog, safeStorage } from 'electron'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { readFileSync } from 'node:fs'
import { KernelHost } from './kernel-host'
import { KernelController } from './kernel-controller'
import { CredentialStore } from './credentials'
import { ModelVault } from './model-vault'
import { FeishuVault } from './feishu-vault'
import { registerWorkflowBridge } from './workflow-bridge'
import { registerAppearance, setNativeMenus } from './appearance'
import { DiagnosticReports } from './diagnostic-reports'
import { DesktopNotifications } from './desktop-notifications'

let window: BrowserWindow | undefined
let host: KernelController | undefined
let tray: Tray | undefined
let quitting = false
let quitPending = false
let modelVault: ModelVault | undefined
let feishuVault: FeishuVault | undefined
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
    autoHideMenuBar: true,
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
    if (event.url !== rendererUrl) event.preventDefault()
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
    notifications.stop()
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

const diagnosticReports = new DiagnosticReports({
  client: () => {
    if (!host) throw new Error('内核未启动')
    return host.client
  },
  window: () => window,
  root,
  desktop: {
    version: app.getVersion(),
    electron: process.versions.electron ?? 'unknown',
    chromium: process.versions.chrome ?? 'unknown',
  },
  credentialsAvailable: () =>
    new CredentialStore(join(app.getPath('userData'), 'credentials')).available(),
})

ipcMain.handle('weftpilot:diagnostics', async (event) => {
  if (
    event.sender !== window?.webContents ||
    event.senderFrame !== window.webContents.mainFrame ||
    event.senderFrame.url !== rendererUrl
  ) {
    throw new Error('不允许的 IPC 来源')
  }
  return diagnosticReports.query()
})

ipcMain.handle('weftpilot:exportDiagnostics', async (event, input: unknown) => {
  if (
    event.sender !== window?.webContents ||
    event.senderFrame !== window.webContents.mainFrame ||
    event.senderFrame.url !== rendererUrl
  )
    throw new Error('不允许的 IPC 来源')
  return diagnosticReports.export(input)
})

const notifications = new DesktopNotifications({
  userData: app.getPath('userData'),
  rendererUrl,
  window: () => window,
  client: () => {
    if (!host) throw new Error('KERNEL_STOPPED')
    return host.client
  },
})
notifications.register()
const nativeUi = {
  window: () => window,
  tray: () => tray,
  quit,
  rendererUrl,
  languageChanged: (language: 'zh-CN' | 'en') => notifications.language(language),
}
registerAppearance(nativeUi)

registerWorkflowBridge({
  controller: () => {
    if (!host) throw new Error('内核未启动')
    return host
  },
  window: () => window,
  rendererUrl,
  vault: () => {
    if (!modelVault) throw new Error('CREDENTIAL_STORAGE_UNAVAILABLE')
    return modelVault
  },
  feishuVault: () => {
    if (!feishuVault) throw new Error('CREDENTIAL_STORAGE_UNAVAILABLE')
    return feishuVault
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
      // 与NSIS正式/隔离验证安装器的有限身份一致，不注册额外协议或修改系统通知设置。
      if (process.platform === 'win32')
        app.setAppUserModelId(
          app.getName() === 'weftpilot-validation'
            ? 'io.weftpilot.desktop.validation'
            : 'io.weftpilot.desktop',
        )
      const encryption = {
        available: () => safeStorage.isEncryptionAvailable(),
        encrypt: (value: string) => safeStorage.encryptString(value),
        decrypt: (value: Buffer) => safeStorage.decryptString(value),
      }
      modelVault = new ModelVault(join(app.getPath('userData'), 'credentials/models'), encryption)
      feishuVault = new FeishuVault(join(app.getPath('userData'), 'credentials/feishu'), encryption)
      host = createController(modelVault, feishuVault)
      createWindow()
      const image = nativeImage.createFromPath(join(root, 'renderer/brand/tray.png'))
      tray = new Tray(image.resize({ width: 20, height: 20 }))
      tray.setToolTip('纬舟 WeftPilot')
      tray.on('double-click', () => window?.show())
      setNativeMenus(nativeUi, 'zh-CN')
      notifications.start()
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

const createController = (vault: ModelVault, feishu: FeishuVault): KernelController => {
  const lock = JSON.parse(readFileSync(join(root, 'kernel-lock.json'), 'utf8')) as {
    sourceCommit: string
  }
  return new KernelController({
    userData: app.getPath('userData'),
    sourceCommit: lock.sourceCommit,
    createHost: (directory) => new KernelHost(root, directory, vault, feishu),
  })
}
