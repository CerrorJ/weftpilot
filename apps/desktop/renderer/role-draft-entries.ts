import { z } from 'zod'
import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import { initialRoleDraft, readRoleDraft } from './role-draft'

const prefix = 'weftpilot.role-draft.'
const targetSchema = z.union([
  z.literal('new'),
  z.uuid(),
  z.string().regex(/^new\.[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/),
])

export interface RoleDraftEntry {
  target: string
  name: string
  baseVersion: number
  unavailable: boolean
}

/** 新建使用独立表单键，不能清空旧new草稿或另一个尚未提交的表单。 */
export const newRoleDraftTarget = (): string => `new.${crypto.randomUUID()}`

/** 只索引本窗口的有效表单；不写权威对象，也不在读取时迁移/删除旧存储。 */
export const readRoleDraftEntries = (roles: RoleVersion[]): RoleDraftEntry[] => {
  try {
    const entries: RoleDraftEntry[] = []
    for (let index = 0; index < sessionStorage.length; index++) {
      const key = sessionStorage.key(index)
      if (!key?.startsWith(prefix)) continue
      const target = targetSchema.safeParse(key.slice(prefix.length))
      if (!target.success) continue
      const role = roles.find((item) => item.id === target.data)
      const draft = readRoleDraft(key, role ? initialRoleDraft(role) : undefined)
      if (!draft) continue
      entries.push({
        target: target.data,
        name: draft.name,
        baseVersion: draft.baseVersion,
        unavailable: !target.data.startsWith('new') && !role,
      })
    }
    return entries.sort((left, right) => left.target.localeCompare(right.target))
  } catch {
    // 存储不可读时不猜测草稿内容，更不能删除它后重新创建。
    return []
  }
}
