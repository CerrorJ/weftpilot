import { z } from 'zod'
import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'

/** 草稿只含用户可见的应用身份，不保存Secret或密文引用。 */
export const roleFeishuDraftFields = {
  feishuMode: z.enum(['new', 'existing', 'none', 'inherit']).default('none'),
  feishuAppId: z.string().max(200).default(''),
  feishuTenantKey: z.string().max(200).default(''),
  feishuOwnerOpenId: z.string().max(200).default(''),
  feishuChatId: z.string().max(200).default(''),
  feishuEnabled: z.boolean().default(true),
}

export const initialRoleFeishuDraft = (role: RoleVersion | undefined) => {
  const binding = role?.feishuBinding
  if (!binding)
    return {
      feishuMode: role && binding === undefined ? ('inherit' as const) : ('none' as const),
      feishuAppId: '',
      feishuTenantKey: '',
      feishuOwnerOpenId: '',
      feishuChatId: '',
      feishuEnabled: true,
    }
  return {
    feishuMode: 'existing' as const,
    feishuAppId: binding.appId,
    feishuTenantKey: binding.tenantKey,
    feishuOwnerOpenId: binding.ownerOpenId,
    feishuChatId: binding.chatId,
    feishuEnabled: binding.enabled,
  }
}

/** fieldset停用时FormData不含勾选值，仍保留草稿的公开许可意图。 */
export const readRoleFeishuEnabled = (element: HTMLFormElement, fallback?: boolean): boolean =>
  element.querySelector<HTMLInputElement>('input[name="feishuEnabled"]')?.checked ??
  fallback ??
  true
