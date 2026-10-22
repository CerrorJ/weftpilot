import { ipcMain, shell } from 'electron'
import type { IpcMainInvokeEvent } from 'electron'
import { z } from 'zod'
import type { KernelClient } from '../../../packages/kernel-client/client'
import type { FeishuVault } from './feishu-vault'
import { prepareFeishuSubmission } from './feishu-submission'

/** 固定命名操作与固定官方控制台地址；不允许页面提供 API 地址或外部链接。 */
export const registerFeishuBridge = (options: {
  assertSender: (event: IpcMainInvokeEvent) => unknown
  client: () => KernelClient
  vault: () => FeishuVault
}): void => {
  const operations = {
    connectFeishu: 'feishu.connect',
    disconnectFeishu: 'feishu.disconnect',
    feishuStatus: 'feishu.status',
  } as const
  for (const [name, method] of Object.entries(operations))
    ipcMain.handle(`workflow:${name}`, (event) => {
      options.assertSender(event)
      return options.client().request(method)
    })
  ipcMain.handle('workflow:saveFeishu', async (event, raw: unknown) => {
    options.assertSender(event)
    const parsed = z
      .object({ key: z.string().uuid(), input: z.record(z.string(), z.unknown()) })
      .strict()
      .safeParse(raw)
    if (!parsed.success) throw new Error('VALIDATION_FAILED')
    const input = parsed.data
    const command = await prepareFeishuSubmission({ ...input, vault: options.vault() })
    return options.client().command(command, input.key)
  })
  ipcMain.handle('workflow:openFeishuConsole', async (event) => {
    options.assertSender(event)
    await shell.openExternal('https://open.feishu.cn/app')
  })
}
