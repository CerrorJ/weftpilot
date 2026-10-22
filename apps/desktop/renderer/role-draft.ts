import { z } from 'zod'
import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import { skillReferenceSchema } from '@weftpilot/agent-team-kernel/protocol'
import { selectedSkills } from './role-skills'

const draftSchema = z
  .object({
    name: z.string().max(200),
    responsibility: z.string().max(20_000),
    cli: z.enum(['codex', 'claude']),
    profile: z.string().max(100),
    model: z.string().max(200),
    permission: z.enum(['read-only', 'workspace-write']),
    skills: z.array(skillReferenceSchema).max(12),
  })
  .strict()
export type RoleDraft = z.infer<typeof draftSchema>
export const initialRoleDraft = (role: RoleVersion | undefined): RoleDraft => {
  if (!role)
    return {
      name: '',
      responsibility: '',
      cli: 'codex',
      profile: '',
      model: '',
      permission: 'read-only',
      skills: [],
    }
  const profile = role.modelProfileSnapshot
  return {
    name: role.name,
    responsibility: role.responsibility,
    cli: role.cli,
    profile: profile ? `${profile.id}@${profile.version}` : '',
    model: role.model,
    permission: role.permission,
    skills: role.skills,
  }
}
export const roleDraftKey = (role: RoleVersion | undefined): string =>
  `weftpilot.role-draft.${role ? `${role.id}.${role.version}` : 'new'}`

/** 这里只保存表单草稿，无凭据或权威业务状态；跨技能中心导航保留正在编写的职责和配置。 */
export const readRoleDraft = (key: string): RoleDraft | undefined => {
  try {
    const result = draftSchema.safeParse(JSON.parse(sessionStorage.getItem(key) ?? 'null'))
    return result.success ? result.data : undefined
  } catch {
    return undefined
  }
}

export const writeRoleDraft = (key: string, element: HTMLFormElement): void => {
  const form = new FormData(element)
  const fields = Object.fromEntries(
    ['name', 'responsibility', 'cli', 'profile', 'model', 'permission'].map((name) => [
      name,
      String(form.get(name) ?? ''),
    ]),
  )
  const draft = draftSchema.safeParse({ ...fields, skills: selectedSkills(form) })
  if (!draft.success) return
  try {
    sessionStorage.setItem(key, JSON.stringify(draft.data))
  } catch {
    /* 存储不可用不阻断表单操作。 */
  }
}

export const clearRoleDraft = (key: string): void => {
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* 保存已经成功，不将草稿清理失败变成业务失败。 */
  }
}

export const readSelectedRole = (): string => {
  try {
    return sessionStorage.getItem('weftpilot.role-selection') ?? ''
  } catch {
    return ''
  }
}

export const rememberSelectedRole = (id: string): void => {
  try {
    sessionStorage.setItem('weftpilot.role-selection', id)
  } catch {
    /* 当前窗口仍可选择角色。 */
  }
}
