import {
  credentialRequestSchema,
  credentialResponseSchema,
} from '@weftpilot/agent-team-kernel/protocol'
import type { ModelVault } from './model-vault'

/** 只监听本次 UtilityProcess 的私有端口，不注册读取密钥的 renderer IPC。 */
export const hostCredentials = (options: {
  vault: ModelVault
  send: (message: unknown) => void
}): ((message: unknown) => void) => {
  let active = 0
  return (message) => {
    const request = credentialRequestSchema.safeParse(message)
    if (!request.success) return
    const { id, binding } = request.data
    if (active >= 8) return
    active++
    void options.vault
      .read(binding)
      .catch(() => null)
      .then((value) => {
        try {
          options.send(
            credentialResponseSchema.parse({
              protocolVersion: 1,
              kind: 'host.credential.result',
              id,
              value,
            }),
          )
        } catch {
          // 内核可能已经退出；不输出错误对象或凭据，内核仍使用有界超时处理。
        }
      })
      .finally(() => {
        active--
      })
  }
}
