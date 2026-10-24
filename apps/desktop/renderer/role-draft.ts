import { z } from 'zod'
import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import { skillReferenceSchema } from '@weftpilot/agent-team-kernel/protocol'

export const roleDraftSchema = z
  .object({
    name: z.string().max(200),
    responsibility: z.string().max(20_000),
    cli: z.enum(['codex', 'claude']),
    profile: z.string().max(100),
    model: z.string().max(200),
    permission: z.enum(['read-only', 'workspace-write']),
    skills: z.array(skillReferenceSchema).max(12),
    slug: z.string().max(64).default(''),
    inputRequirements: z.string().max(20_000).default(''),
    deliveryRequirements: z.string().max(20_000).default(''),
    maxConcurrency: z.number().int().min(1).max(2).default(1),
    step: z.number().int().min(0).max(5).default(0),
    baseVersion: z.number().int().nonnegative().default(0),
  })
  .strict()
export type RoleDraft = z.infer<typeof roleDraftSchema>
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
      slug: `role-${crypto.randomUUID().slice(0, 8)}`,
      inputRequirements: '',
      deliveryRequirements: '',
      maxConcurrency: 1,
      step: 0,
      baseVersion: 0,
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
    slug: role.slug ?? `role-${role.id.replaceAll('-', '')}`,
    inputRequirements: role.inputRequirements ?? '',
    deliveryRequirements: role.deliveryRequirements ?? '',
    maxConcurrency: role.maxConcurrency ?? 1,
    step: 0,
    baseVersion: role.version,
  }
}
export const roleDraftKey = (role: RoleVersion | undefined): string =>
  `weftpilot.role-draft.${role?.id ?? 'new'}`

/** 这里只保存表单草稿，无凭据或权威业务状态；跨技能中心导航保留正在编写的职责和配置。 */
export const readRoleDraft = (key: string, fallback?: RoleDraft): RoleDraft | undefined => {
  try {
    const raw: unknown = JSON.parse(
      sessionStorage.getItem(key) ??
        sessionStorage.getItem(`${key}.${fallback?.baseVersion ?? 0}`) ??
        'null',
    )
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
    const result = roleDraftSchema.safeParse({ ...fallback, ...raw })
    return result.success ? result.data : undefined
  } catch {
    return undefined
  }
}

export const writeRoleDraft = (
  key: string,
  element: HTMLFormElement,
  step?: number,
): RoleDraft | undefined => {
  const form = new FormData(element)
  const fields = Object.fromEntries(
    [
      'name',
      'responsibility',
      'cli',
      'profile',
      'model',
      'permission',
      'slug',
      'inputRequirements',
      'deliveryRequirements',
    ].map((name) => [name, String(form.get(name) ?? '')]),
  )
  // CLI切换时旧select可能尚未完成React重绘；草稿必须同步清空旧引擎的模型引用。
  const previous = readRoleDraft(key)
  if (previous && previous.cli !== fields.cli) fields.profile = ''
  const draft = roleDraftSchema.safeParse({
    ...fields,
    skills: selectedSkills(form),
    maxConcurrency: Number(form.get('maxConcurrency')),
    step: step ?? Number(form.get('step')),
    baseVersion: Number(form.get('baseVersion')),
  })
  if (!draft.success) return
  try {
    sessionStorage.setItem(key, JSON.stringify(draft.data))
  } catch {
    /* 存储不可用不阻断表单操作。 */
  }
  return draft.data
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

/** 表单仅传递固定引用，技能可用性与内容摘要仍由内核核对。 */
export const selectedSkills = (form: FormData) =>
  form.getAll('skills').map((value) => {
    const [id, digest] = String(value).split('@')
    return { id: id!, digest: digest! }
  })
