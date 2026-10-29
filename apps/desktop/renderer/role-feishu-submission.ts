import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { RoleSubmission } from '../../../packages/kernel-client/bridge-contract'

/** 不规范化身份/引用，不保存明文到草稿；格式与归属仍交给宿主和内核验证。 */
export const roleFeishuSubmission = (
  form: FormData,
  role: RoleVersion | undefined,
): Pick<RoleSubmission, 'feishu' | 'feishuSecret'> => {
  const mode = rawField(form, 'feishuMode') || 'inherit'
  if (mode === 'inherit') return {}
  if (mode === 'none') return { feishu: null }
  const secret = rawField(form, 'roleFeishuSecret')
  return {
    feishu: {
      appId: rawField(form, 'feishuAppId'),
      tenantKey: rawField(form, 'feishuTenantKey'),
      ownerOpenId: rawField(form, 'feishuOwnerOpenId'),
      chatId: rawField(form, 'feishuChatId'),
      credentialRef: role?.feishuBinding?.credentialRef ?? '',
      enabled: form.has('feishuEnabled'),
    },
    ...(secret ? { feishuSecret: secret } : {}),
  }
}

const rawField = (form: FormData, name: string): string => String(form.get(name) ?? '')
