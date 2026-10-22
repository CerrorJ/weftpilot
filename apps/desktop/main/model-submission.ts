import { z } from 'zod'
import {
  businessCommandSchema,
  credentialBindingSchema,
  type BusinessCommand,
} from '@weftpilot/agent-team-kernel/protocol'
import type { ModelVault } from './model-vault'

const inputSchema = z.object({ secret: z.string().max(16384).optional() }).passthrough()

/** 先保存不可变密文，再提交纯引用。超时保留密文以支持相同命令键重试。 */
export const prepareModelSubmission = async (options: {
  input: Record<string, unknown>
  key: string
  vault: ModelVault
}): Promise<Extract<BusinessCommand, { type: 'model.save' }>> => {
  const { secret, ...fields } = inputSchema.parse(options.input)
  const command = businessCommandSchema.parse({ ...fields, type: 'model.save' })
  if (command.type !== 'model.save') throw new Error('MODEL_CONFIG_INVALID')
  if (command.provider === 'cli-managed') {
    if (secret || command.baseUrl || command.credentialRef) throw new Error('MODEL_CONFIG_INVALID')
    return command
  }
  validateProvider(command)
  const binding = credentialBindingSchema.parse({
    reference: secret ? `model-${options.key}` : command.credentialRef,
    provider: command.provider,
    baseUrl: command.baseUrl,
  })
  if (secret) await options.vault.save(binding, secret)
  else await options.vault.read(binding)
  return { ...command, baseUrl: binding.baseUrl, credentialRef: binding.reference }
}

const validateProvider = (command: Extract<BusinessCommand, { type: 'model.save' }>) => {
  const expected = command.cli === 'codex' ? 'openai-compatible' : 'anthropic-compatible'
  if (command.provider !== expected || !command.model) throw new Error('MODEL_CONFIG_INVALID')
}
