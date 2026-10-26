import { clipboard, ipcMain, type BrowserWindow, type IpcMainInvokeEvent } from 'electron'
import type { KernelClient } from '../../../packages/kernel-client/client'
import { ProjectClipboard } from './project-clipboard'

export const registerProjectClipboardBridge = (options: {
  assertSender: (event: IpcMainInvokeEvent) => BrowserWindow
  client: () => KernelClient
}): void => {
  const copy = new ProjectClipboard({
    inspect: (id) => options.client().inspectProject(id),
    write: (value) => clipboard.writeText(value),
    read: () => clipboard.readText(),
  })
  ipcMain.handle('workflow:copyProjectGitAddress', (event, raw: unknown) =>
    copy.copy(raw, () => {
      options.assertSender(event)
    }),
  )
}
