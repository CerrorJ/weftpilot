import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { z } from 'zod'
import type { KernelClient } from '../../../packages/kernel-client/client'
import type { FeishuVault } from './feishu-vault'
import { prepareRoleSubmission } from './role-submission'
import { parseInput } from './input-validation'

/** 角色渠道只暴露命名用例；认证上下文由宿主和内核控制，不接收任意API地址。 */
export const registerRoleFeishuBridge = (options: {
  assertSender: (event: IpcMainInvokeEvent) => unknown
  client: () => KernelClient
  vault: () => FeishuVault
}): void => {
  ipcMain.handle('workflow:saveRole', async (event, raw: unknown) => {
    options.assertSender(event)
    const input = parseInput(
      z.object({ key: z.string().uuid(), input: z.record(z.string(), z.unknown()) }).strict(),
      raw,
    )
    const command = await prepareRoleSubmission({ ...input, vault: options.vault() })
    return options.client().command(command, input.key)
  })
  const queries = {
    connectRoleFeishu: 'feishu.role.connect',
    disconnectRoleFeishu: 'feishu.role.disconnect',
    roleFeishuStatus: 'feishu.role.status',
  } as const
  for (const [name, method] of Object.entries(queries)) {
    ipcMain.handle(`workflow:${name}`, (event, raw: unknown) => {
      options.assertSender(event)
      if (method === 'feishu.role.connect') {
        const input = parseInput(
          z
            .object({ roleId: z.string().uuid(), expectedRoleVersion: z.number().int().positive() })
            .strict(),
          raw,
        )
        return options.client().roleFeishu({ ...input, method })
      }
      const input = parseInput(z.object({ roleId: z.string().uuid() }).strict(), raw)
      return options.client().roleFeishu({ ...input, method })
    })
  }
}
