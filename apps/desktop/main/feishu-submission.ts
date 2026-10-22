import { z } from 'zod'
import {
  businessCommandSchema,
  feishuCredentialBindingSchema,
} from '@weftpilot/agent-team-kernel/protocol'
import type { FeishuVault } from './feishu-vault'

/** 宿主先原子发布密文，再向内核提交纯引用；超时保留密文以便原命令幂等重试。 */
export const prepareFeishuSubmission = async (options: {
  key: string
  input: Record<string, unknown>
  vault: FeishuVault
}) => {
  const parsed = z
    .object({ secret: z.string().max(16384).optional() })
    .passthrough()
    .safeParse(options.input)
  if (!parsed.success) throw new Error('VALIDATION_FAILED')
  const { secret, ...fields } = parsed.data
  const validated = businessCommandSchema.safeParse({
    ...fields,
    type: 'feishu.save',
    credentialRef: secret ? `feishu-${options.key}` : fields.credentialRef,
  })
  if (!validated.success) throw new Error('VALIDATION_FAILED')
  const command = validated.data
  if (command.type !== 'feishu.save') throw new Error('VALIDATION_FAILED')
  const binding = feishuCredentialBindingSchema.parse({
    reference: command.credentialRef,
    appId: command.appId,
  })
  if (secret) await options.vault.save(binding, secret)
  else await options.vault.read(binding)
  return command
}
