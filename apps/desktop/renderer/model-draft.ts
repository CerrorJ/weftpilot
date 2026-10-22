import type { ModelProfile } from '@weftpilot/agent-team-kernel/protocol'
import type { ModelSubmission } from '../../../packages/kernel-client/bridge-contract'
import { formText } from './form-fields'

export const modelDraft = (form: FormData, profile: ModelProfile | undefined): ModelSubmission => ({
  ...(profile ? { id: profile.id } : {}),
  expectedVersion: profile?.version ?? 0,
  name: formText(form, 'name'),
  cli: formText(form, 'cli') === 'claude' ? 'claude' : 'codex',
  model: formText(form, 'model'),
  reasoningEffort: formText(form, 'effort') as ModelProfile['reasoningEffort'],
  ...providerDraft(form, profile),
})

const providerDraft = (form: FormData, profile: ModelProfile | undefined) => {
  if (formText(form, 'provider') !== 'custom')
    return { provider: 'cli-managed' as const, baseUrl: '', credentialRef: null }
  const secret = String(form.get('secret') ?? '')
  return {
    provider:
      formText(form, 'cli') === 'claude'
        ? ('anthropic-compatible' as const)
        : ('openai-compatible' as const),
    baseUrl: formText(form, 'baseUrl'),
    credentialRef: profile?.credentialRef ?? null,
    ...(secret ? { secret } : {}),
  }
}
