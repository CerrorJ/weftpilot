import { z } from 'zod'
import {
  businessCommandSchema,
  feishuCredentialBindingSchema,
  type FeishuCredentialBinding,
} from '@weftpilot/agent-team-kernel/protocol'
import type { FeishuVault } from './feishu-vault'

/** 明文只在宿主密文桥接中消费；配置CAS失败保留密文，便于同命令键对账重试。 */
export const prepareRoleSubmission = async (options: {
  key: string
  input: Record<string, unknown>
  vault: FeishuVault
}) => {
  const parsed = z
    .object({
      feishuSecret: z.string().max(16384).optional(),
      feishu: z.record(z.string(), z.unknown()).nullable().optional(),
    })
    .passthrough()
    .safeParse(options.input)
  if (!parsed.success) throw new Error('VALIDATION_FAILED')
  const { feishuSecret, feishu: rawConnection, ...fields } = parsed.data
  if (feishuSecret && !rawConnection) throw new Error('VALIDATION_FAILED')
  const feishu = rawConnection
    ? { ...rawConnection, ...(feishuSecret ? { credentialRef: `feishu-${options.key}` } : {}) }
    : rawConnection
  const validated = businessCommandSchema.safeParse({
    ...fields,
    type: 'role.save',
    ...(feishu === undefined ? {} : { feishu }),
  })
  if (!validated.success || validated.data.type !== 'role.save')
    throw new Error('VALIDATION_FAILED')
  const command = validated.data
  if (command.feishu) {
    const binding = feishuCredentialBindingSchema.parse({
      reference: command.feishu.credentialRef,
      appId: command.feishu.appId,
    })
    await ensureCredential(options.vault, binding, feishuSecret)
  }
  return command
}

const ensureCredential = (
  vault: FeishuVault,
  binding: FeishuCredentialBinding,
  secret: string | undefined,
) => (secret ? vault.save(binding, secret) : vault.read(binding))
