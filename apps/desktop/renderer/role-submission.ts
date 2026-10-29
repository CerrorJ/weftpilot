import type { RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { formText } from './form-fields'
import { selectedSkills } from './role-draft'
import { roleFeishuSubmission } from './role-feishu-submission'

/** UI只组装角色用例；格式、唯一性、版本比较交换和业务事务仍由内核负责。 */
export const saveRoleConfiguration = async (input: {
  form: HTMLFormElement
  role: RoleVersion | undefined
  actions: WorkspaceActions
}) => {
  const form = new FormData(input.form)
  const secretField = input.form.elements.namedItem('roleFeishuSecret')
  const submittedSecret = String(form.get('roleFeishuSecret') ?? '')
  const role = input.role
  const result = await input.actions.saveRole({
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
    ...roleFeishuSubmission(form, role),
  })
  if (result) clearSubmittedSecret(secretField, submittedSecret)
  return result
}

/** 迟到回执只清除原输入的原值，不能擦除重载或等待期间新输入的密钥。 */
const clearSubmittedSecret = (field: Element | RadioNodeList | null, submitted: string) => {
  if (field instanceof HTMLInputElement && field.isConnected && field.value === submitted)
    field.value = ''
}

const selectedModel = (value: string) => {
  if (!value) return null
  const [id, version] = value.split('@')
  return { id: id!, version: Number(version) }
}
