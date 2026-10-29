import { useEffect, useRef, useState } from 'react'
import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import {
  initialRoleDraft,
  readRoleDraft,
  writeRoleDraft,
  clearRoleDraft,
  roleDraftKey,
  rememberSelectedRole,
} from './role-draft'

/** 本地只保存未提交表单及其起始版本；角色身份在保存后转入编辑时明确切换。 */
export const useRoleFormDraft = (
  role: RoleVersion | undefined,
  roles: RoleVersion[],
  newDraftId = 'new',
) => {
  const key = useRef(roleDraftKey(role, newDraftId))
  const form = useRef<HTMLFormElement>(null)
  const [state, setState] = useState(() => initialState(role, roles, key.current))
  const persist = (step = state.step) => {
    if (!form.current) return
    const draft = writeRoleDraft(key.current, form.current, step)
    if (draft) setState((current) => ({ ...current, preview: draft }))
  }
  const adopt = (saved: RoleVersion) => {
    key.current = roleDraftKey(saved)
    rememberSelectedRole(saved.id)
    setState((current) => ({ ...current, base: saved }))
  }
  const reload = (currentRole: RoleVersion | undefined) => {
    clearRoleDraft(key.current)
    key.current = roleDraftKey(currentRole, newDraftId)
    rememberSelectedRole(currentRole?.id ?? newDraftId)
    const initial = initialRoleDraft(currentRole)
    setState((current) => ({
      initial,
      preview: initial,
      base: currentRole,
      step: 0,
      revision: current.revision + 1,
    }))
  }
  useEffect(() => {
    rememberSelectedRole(role?.id ?? newDraftId)
  }, [role?.id, newDraftId])
  return {
    ...state,
    key,
    form,
    persist,
    adopt,
    reload,
    baseMissing: state.initial.baseVersion > 0 && !state.base,
    selectStep: (step: number) => setState((current) => ({ ...current, step })),
  }
}

const initialState = (role: RoleVersion | undefined, roles: RoleVersion[], key: string) => {
  const fallback = initialRoleDraft(role)
  const stored = readRoleDraft(key, fallback)
  const version = stored?.baseVersion ?? fallback.baseVersion
  const base = role && roles.find((item) => item.id === role.id && item.version === version)
  // 新增字段须从草稿固定的历史版本补缺省，不能借最新配置静默改写旧草稿。
  const initial =
    stored && base ? (readRoleDraft(key, initialRoleDraft(base)) ?? stored) : (stored ?? fallback)
  return { initial, preview: initial, base, step: initial.step, revision: 0 }
}
