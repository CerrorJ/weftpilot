import { dialog, ipcMain, type BrowserWindow, type IpcMainInvokeEvent } from 'electron'
import { z } from 'zod'
import {
  businessCommandSchema,
  preflightInputSchema,
  cliCheckInputSchema,
  projectInspectionInputSchema,
  type BusinessCommand,
} from '@weftpilot/agent-team-kernel/protocol'
import type { KernelClient } from '../../../packages/kernel-client/client'
import type { ModelVault } from './model-vault'
import { prepareModelSubmission } from './model-submission'
import type { FeishuVault } from './feishu-vault'
import { registerFeishuBridge } from './feishu-bridge'
import { registerMaintenanceBridge } from './maintenance-bridge'
import type { KernelController } from './kernel-controller'
import { parseInput } from './input-validation'
import { registerProjectClipboardBridge } from './project-clipboard-bridge'

const submissionSchema = z
  .object({ key: z.string().uuid(), input: z.record(z.string(), z.unknown()) })
  .strict()
const commandTypes = {
  saveRole: 'role.save',
  copyRole: 'role.copy',
  saveSkillSource: 'skill.source.save',
  importSkill: 'skill.import',
  activateSkill: 'skill.activate',
  uninstallSkill: 'skill.uninstall',
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
  resolveHuman: 'human.resolve',
} as const

/** 系统目录选择与业务命令分开；所有操作验证顶层渲染进程来源。 */
export const registerWorkflowBridge = (options: {
  window: () => BrowserWindow | undefined
  client: () => KernelClient
  rendererUrl: string
  vault: () => ModelVault
  feishuVault: () => FeishuVault
  controller: () => KernelController
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
  registerQueries({ ...options, assertSender })
  registerProjectClipboardBridge({ client: options.client, assertSender })
  for (const [method, type] of Object.entries(commandTypes)) {
    ipcMain.handle(`workflow:${method}`, (event, raw: unknown) => {
      assertSender(event)
      const input = parseInput(submissionSchema, raw)
      return options
        .client()
        .command(parseInput(businessCommandSchema, { ...input.input, type }), input.key)
    })
  }
  registerProjectPicker({ ...options, assertSender })
  registerMaintenanceBridge({ assertSender, controller: options.controller })
  registerFeishuBridge({ assertSender, client: options.client, vault: options.feishuVault })
  ipcMain.handle('workflow:saveModel', async (event, raw: unknown) => {
    assertSender(event)
    const input = parseInput(submissionSchema, raw)
    const command = await prepareModelSubmission({ ...input, vault: options.vault() })
    return options.client().command(command, input.key)
  })
}

const registerQueries = (options: {
  assertSender: (event: IpcMainInvokeEvent) => BrowserWindow
  client: () => KernelClient
}): void => {
  ipcMain.handle('workflow:snapshot', (event) => {
    options.assertSender(event)
    return options.client().request('workspace.snapshot')
  })
  ipcMain.handle('workflow:preflight', (event, raw: unknown) => {
    options.assertSender(event)
    return options.client().preflight(parseInput(preflightInputSchema, raw))
  })
  ipcMain.handle('workflow:inspectProject', (event, raw: unknown) => {
    options.assertSender(event)
    const input = parseInput(projectInspectionInputSchema, raw)
    return options.client().inspectProject(input.projectId)
  })
  ipcMain.handle('workflow:checkCli', (event, raw: unknown) => {
    options.assertSender(event)
    return options.client().checkCli(parseInput(cliCheckInputSchema, raw))
  })
  for (const method of ['delivery', 'run', 'activity'] as const)
    ipcMain.handle(`workflow:${method}`, (event, raw: unknown) => {
      options.assertSender(event)
      return options.client().detail(`workspace.${method}`, parseInput(z.string().uuid(), raw))
    })
}

const registerProjectPicker = (options: {
  client: () => KernelClient
  assertSender: (event: IpcMainInvokeEvent) => BrowserWindow
}): void => {
  ipcMain.handle('workflow:createProject', async (event, raw: unknown) => {
    const window = options.assertSender(event)
    const input = parseInput(submissionSchema, raw)
    const fieldsSchema = z
      .object({
        name: z.string().trim().min(1).max(200),
        defaultBranch: z.string().trim().min(1).max(200),
      })
      .strict()
    const fields = parseInput(fieldsSchema, input.input)
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
    return options.client().command(parseInput(businessCommandSchema, command), input.key)
  })
}
