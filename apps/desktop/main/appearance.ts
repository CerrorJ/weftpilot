import { ipcMain, Menu, nativeTheme, type BrowserWindow, type Tray } from 'electron'
import { z } from 'zod'

const appearanceSchema = z
  .object({ language: z.enum(['zh-CN', 'en']), theme: z.enum(['system', 'light', 'dark']) })
  .strict()
interface NativeUi {
  window: () => BrowserWindow | undefined
  tray: () => Tray | undefined
  quit: () => Promise<void>
  rendererUrl: string
}

/** 主题和菜单属于系统桥接；不会写入或改变业务状态。 */
export const registerAppearance = (ui: NativeUi): void => {
  ipcMain.handle('weftpilot:appearance', (event, raw: unknown) => {
    const window = ui.window()
    if (
      !window ||
      event.sender !== window.webContents ||
      event.senderFrame !== window.webContents.mainFrame ||
      event.senderFrame.url !== ui.rendererUrl
    )
      throw new Error('不允许的 IPC 来源')
    const value = appearanceSchema.parse(raw)
    nativeTheme.themeSource = value.theme
    setNativeMenus(ui, value.language)
  })
}

export const setNativeMenus = (ui: NativeUi, language: 'zh-CN' | 'en'): void => {
  const label = (zh: string, en: string) => (language === 'en' ? en : zh)
  const quit = {
    label: label('完全退出', 'Quit WeftPilot'),
    accelerator: 'CmdOrCtrl+Q',
    click: () => {
      void ui.quit()
    },
  }
  ui.tray()?.setContextMenu(
    Menu.buildFromTemplate([
      { label: label('打开纬舟', 'Open WeftPilot'), click: () => ui.window()?.show() },
      quit,
    ]),
  )
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      { label: label('纬舟', 'WeftPilot'), submenu: [quit] },
      {
        label: label('编辑', 'Edit'),
        submenu: [
          { role: 'undo', label: label('撤销', 'Undo') },
          { role: 'redo', label: label('重做', 'Redo') },
          { role: 'cut', label: label('剪切', 'Cut') },
          { role: 'copy', label: label('复制', 'Copy') },
          { role: 'paste', label: label('粘贴', 'Paste') },
          { role: 'selectAll', label: label('全选', 'Select All') },
        ],
      },
    ]),
  )
}
