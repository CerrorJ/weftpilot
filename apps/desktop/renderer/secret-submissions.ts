import type {
  ModelSubmission,
  FeishuSubmission,
  RoleSubmission,
} from '../../../packages/kernel-client/bridge-contract'
import { parseCommandResult } from '../../../packages/kernel-client/command-result'
import type { useSubmission } from './use-submission'
import { workflow } from './desktop-api'

/** 宿主凭据提交仅以摘要缓存幂等键，不将Secret放入普通命令或草稿。 */
export const secretSubmissions = (perform: ReturnType<typeof useSubmission>['perform']) => ({
  saveModel: async (input: ModelSubmission) =>
    perform(await secretFingerprint(input, 'model'), (key) => workflow().saveModel({ key, input })),
  saveFeishu: async (input: FeishuSubmission) =>
    perform(await secretFingerprint(input, 'feishu'), (key) =>
      workflow().saveFeishu({ key, input }),
    ),
  saveRole: async (input: RoleSubmission) =>
    perform(await secretFingerprint(input, 'role'), async (key) => {
      const result = parseCommandResult(await workflow().saveRole({ key, input }))
      if (input.id && result.id !== input.id) throw new Error('COMMAND_RESULT_UNCERTAIN')
      return result
    }),
})

const secretFingerprint = async (
  input: ModelSubmission | FeishuSubmission | RoleSubmission,
  scope: string,
): Promise<string> => {
  const encoded = new TextEncoder().encode(JSON.stringify(input))
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return `${scope}:${Array.from(new Uint8Array(digest), (item) => item.toString(16).padStart(2, '0')).join('')}`
}
