import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { formText } from './form-fields'
import { selectedSkills } from './role-draft'

/** UI只组装角色用例；格式、唯一性、版本比较交换和业务事务仍由内核负责。 */
export const saveRoleConfiguration = (input: {
  form: HTMLFormElement
  role: RoleVersion | undefined
  actions: WorkspaceActions
}) => {
  const form = new FormData(input.form)
  const role = input.role
  return input.actions.execute({
    type: 'role.save',
    ...(role ? { id: role.id } : {}),
    expectedVersion: role?.version ?? 0,
    name: formText(form, 'name'),
    responsibility: formText(form, 'responsibility'),
    slug: formText(form, 'slug'),
    inputRequirements: formText(form, 'inputRequirements'),
    deliveryRequirements: formText(form, 'deliveryRequirements'),
    maxConcurrency: Number(form.get('maxConcurrency')),
    cli: formText(form, 'cli') === 'claude' ? 'claude' : 'codex',
    modelProfileRef: selectedModel(formText(form, 'profile')),
    model: formText(form, 'model'),
    permission: form.get('permission') === 'workspace-write' ? 'workspace-write' : 'read-only',
    skills: selectedSkills(form),
  })
}

const selectedModel = (value: string) => {
  if (!value) return null
  const [id, version] = value.split('@')
  return { id: id!, version: Number(version) }
}
