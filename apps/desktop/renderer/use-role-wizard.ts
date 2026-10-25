import { useEffect, type RefObject } from 'react'
import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { latestVersions } from './object-versions'
import { useRoleSave } from './use-role-save'
import { useRoleFormDraft } from './use-role-form-draft'

/** 只持有表单和确切版本引用；试运行与就绪状态始终读取共享内核。 */
export const useRoleWizard = (
  role: RoleVersion | undefined,
  actions: WorkspaceActions,
  newDraftId?: string,
) => {
  const draft = useRoleFormDraft(role, actions.state?.roles ?? [], newDraftId)
  const { saved, savedRole, save, edited } = useRoleSave({
    base: draft.base,
    baseMissing: draft.baseMissing,
    draftKey: draft.key,
    actions,
  })
  const id = saved?.id ?? draft.base?.id ?? role?.id
  const currentRole = latestVersions(actions.state?.roles ?? []).find((item) => item.id === id)
  const persist = (next = draft.step) => {
    if (!saved) draft.persist(next)
  }
  const changeStep = (next: number) => {
    if (actions.busy) return
    if (next > draft.step && !validStep(draft.form.current, draft.step)) return
    if (saved) {
      if (!savedRole) return
      draft.adopt(savedRole)
      edited()
    } else draft.persist(next)
    draft.selectStep(next)
  }
  const reload = () => {
    draft.reload(currentRole)
    edited()
  }
  useRoleStepFocus(draft.form, draft.step, draft.revision)
  return {
    base: draft.base,
    baseMissing: draft.baseMissing,
    initial: draft.initial,
    preview: draft.preview,
    step: draft.step,
    revision: draft.revision,
    form: draft.form,
    currentRole,
    saved,
    savedRole,
    persist,
    changeStep,
    reload,
    save,
  }
}

/** 窄窗及resize保持当前标记可见；切步/明确重载后焦点进入新的内容。 */
const useRoleStepFocus = (
  form: RefObject<HTMLFormElement | null>,
  step: number,
  revision: number,
) => {
  useEffect(() => {
    const reveal = () =>
      form.current
        ?.querySelector<HTMLElement>('.role-steps [aria-current]')
        ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    reveal()
    form.current?.querySelector<HTMLElement>(`[data-role-step="${step}"] h3`)?.focus()
    window.addEventListener('resize', reveal)
    return () => window.removeEventListener('resize', reveal)
  }, [form, step, revision])
}

const validStep = (form: HTMLFormElement | null, step: number): boolean => {
  const fields = form?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    `[data-role-step="${step}"] input, [data-role-step="${step}"] select, [data-role-step="${step}"] textarea`,
  )
  const invalid = Array.from(fields ?? []).find((field) => !field.checkValidity())
  invalid?.reportValidity()
  return !invalid
}
export type RoleWizard = ReturnType<typeof useRoleWizard>
