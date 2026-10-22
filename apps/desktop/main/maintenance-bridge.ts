import { dialog, ipcMain, type BrowserWindow, type IpcMainInvokeEvent } from 'electron'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { z } from 'zod'
import { backupInspectionSchema } from '@weftpilot/agent-team-kernel/protocol'
import type { KernelController } from './kernel-controller'

const languageSchema = z.enum(['zh-CN', 'en'])
const backupInputSchema = z.object({ key: z.string().uuid(), language: languageSchema }).strict()
interface RestoreTicket {
  directory: string
  digest: string
  expiresAt: number
}
interface BridgeOptions {
  assertSender: (event: IpcMainInvokeEvent) => BrowserWindow
  controller: () => KernelController
}

/** 系统选择器产生路径，渲染层只能持有短期票据；批准绑定已查看的清单摘要。 */
export const registerMaintenanceBridge = (options: BridgeOptions): void => {
  const tickets = new Map<string, RestoreTicket>()
  const targets = new Map<string, string>()
  let busy = false
  const perform = async (operation: () => Promise<unknown>) => {
    if (busy) throw new Error('MAINTENANCE_BUSY')
    busy = true
    try {
      return await operation()
    } finally {
      busy = false
    }
  }
  ipcMain.handle('workflow:createBackup', (event, raw: unknown) => {
    const window = options.assertSender(event)
    const input = backupInputSchema.parse(raw)
    return perform(() => createBackup({ window, input, targets, controller: options.controller() }))
  })
  ipcMain.handle('workflow:selectBackup', (event, raw: unknown) => {
    const window = options.assertSender(event)
    const language = languageSchema.parse(raw)
    return perform(() =>
      selectBackup({ window, language, tickets, controller: options.controller() }),
    )
  })
  ipcMain.handle('workflow:restoreBackup', (event, raw: unknown) => {
    options.assertSender(event)
    const id = z.string().uuid().parse(raw)
    return perform(async () => {
      const ticket = tickets.get(id)
      tickets.delete(id)
      if (!ticket || ticket.expiresAt < Date.now()) throw new Error('BACKUP_PREVIEW_STALE')
      return options.controller().restore(ticket.directory, ticket.digest)
    })
  })
  ipcMain.handle('workflow:maintenanceStatus', (event) => {
    options.assertSender(event)
    return options.controller().status()
  })
}

const createBackup = async (options: {
  window: BrowserWindow
  input: z.infer<typeof backupInputSchema>
  targets: Map<string, string>
  controller: KernelController
}) => {
  let targetDirectory = options.targets.get(options.input.key)
  if (!targetDirectory) {
    const selection = await dialog.showOpenDialog(options.window, {
      title: options.input.language === 'en' ? 'Choose a backup parent folder' : '选择备份存放目录',
      properties: ['openDirectory'],
    })
    if (selection.canceled || !selection.filePaths[0]) return { cancelled: true }
    targetDirectory = join(selection.filePaths[0], `WeftPilot-backup-${options.input.key}`)
    if (options.targets.size >= 16) options.targets.delete(options.targets.keys().next().value!)
    options.targets.set(options.input.key, targetDirectory)
  }
  const manifest = await options.controller.client.maintenance({
    method: 'workspace.backup',
    backupId: options.input.key,
    targetDirectory,
  })
  return { directory: targetDirectory, manifest }
}

const selectBackup = async (options: {
  window: BrowserWindow
  language: z.infer<typeof languageSchema>
  tickets: Map<string, RestoreTicket>
  controller: KernelController
}) => {
  const selected = await dialog.showOpenDialog(options.window, {
    title: options.language === 'en' ? 'Choose a WeftPilot backup folder' : '选择纬舟备份目录',
    properties: ['openDirectory'],
  })
  if (selected.canceled || !selected.filePaths[0]) return { cancelled: true }
  const directory = selected.filePaths[0]
  const inspection = backupInspectionSchema.parse(
    await options.controller.client.maintenance({
      method: 'workspace.backup.inspect',
      backupDirectory: directory,
    }),
  )
  const ticket = randomUUID()
  if (options.tickets.size >= 8) options.tickets.delete(options.tickets.keys().next().value!)
  options.tickets.set(ticket, {
    directory,
    digest: inspection.manifestDigest,
    expiresAt: Date.now() + 15 * 60_000,
  })
  return { ticket, directory, ...inspection }
}
