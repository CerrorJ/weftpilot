import { dialog, ipcMain, type BrowserWindow, type IpcMainInvokeEvent } from 'electron'
import { z } from 'zod'
import { businessCommandSchema, type BusinessCommand } from '@weftpilot/agent-team-kernel/protocol'
import type { KernelClient } from '../../../packages/kernel-client/client'

const submissionSchema = z
  .object({ key: z.string().uuid(), input: z.record(z.string(), z.unknown()) })
  .strict()
const commandTypes = {
  saveRole: 'role.save',
  saveModel: 'model.save',
  saveRequirement: 'requirement.save',
  saveTeam: 'team.save',
  trialRole: 'role.trial',
  setRoleEnabled: 'role.setEnabled',
  createTeamTask: 'team.createTask',
  startTeam: 'team.start',
  createTask: 'task.create',
  startRun: 'run.start',
  stopRun: 'run.stop',
  retryRun: 'run.retry',
  acceptDelivery: 'delivery.accept',
} as const

/** 系统目录选择与业务命令分开；所有操作验证顶层渲染进程来源。 */
export const registerWorkflowBridge = (options: {
  window: () => BrowserWindow | undefined
  client: () => KernelClient
  rendererUrl: string
}): void => {
  const assertSender = (event: IpcMainInvokeEvent) => {
    const window = options.window()
    if (
      !window ||
      event.sender !== window.webContents ||
      event.senderFrame !== window.webContents.mainFrame ||
      event.senderFrame.url !== options.rendererUrl
    )
      throw new Error('不允许的 IPC 来源')
    return window
  }
  ipcMain.handle('workflow:snapshot', (event) => {
    assertSender(event)
    return options.client().request('workspace.snapshot')
  })
  for (const [method, type] of Object.entries(commandTypes)) {
    ipcMain.handle(`workflow:${method}`, (event, raw: unknown) => {
      assertSender(event)
      const input = submissionSchema.parse(raw)
      return options
        .client()
        .command(businessCommandSchema.parse({ ...input.input, type }), input.key)
    })
  }
  registerProjectPicker({ ...options, assertSender })
  for (const method of ['delivery', 'run', 'activity'] as const)
    ipcMain.handle(`workflow:${method}`, (event, raw: unknown) => {
      assertSender(event)
      return options.client().detail(`workspace.${method}`, z.string().uuid().parse(raw))
    })
}

const registerProjectPicker = (options: {
  client: () => KernelClient
  assertSender: (event: IpcMainInvokeEvent) => BrowserWindow
}): void => {
  ipcMain.handle('workflow:createProject', async (event, raw: unknown) => {
    const window = options.assertSender(event)
    const input = submissionSchema.parse(raw)
    const fields = z
      .object({
        name: z.string().trim().min(1).max(200),
        defaultBranch: z.string().trim().min(1).max(200),
      })
      .strict()
      .parse(input.input)
    const selected = await dialog.showOpenDialog(window, {
      title: '选择项目 Git 仓库根目录',
      properties: ['openDirectory'],
    })
    if (selected.canceled || !selected.filePaths[0]) return { cancelled: true }
    const command: BusinessCommand = {
      ...fields,
      type: 'project.create',
      repositoryPath: selected.filePaths[0],
    }
    return options.client().command(businessCommandSchema.parse(command), input.key)
  })
}
