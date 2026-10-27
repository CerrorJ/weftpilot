import { useState } from 'react'
import type { Project, RequirementVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { CreateDialog } from './create-dialog'
import { CreationMark } from './creation-mark'
import { TextField } from './form-fields'
import { useRequirementSubmission } from './use-requirement-submission'
import { RequirementMetadataFields } from './requirement-metadata'

interface EditorContext {
  actions: WorkspaceActions
  requirement?: RequirementVersion
  saved?: (id: string) => void
}

export const RequirementEditor = ({ actions, requirement, saved }: EditorContext) => (
  <CreateDialog
    title={requirement ? '编辑需求' : '新建需求'}
    error={actions.error}
    primary={!requirement}
    triggerIcon={requirement ? undefined : <CreationMark />}
  >
    {(close) => (
      <RequirementForm
        actions={actions}
        {...(requirement ? { requirement } : {})}
        saved={(id) => {
          close()
          saved?.(id)
        }}
      />
    )}
  </CreateDialog>
)

/** 编辑基准在打开时固定；后台轮询或其他窗口保存不能覆盖输入或悄悄抬高CAS版本。 */
const RequirementForm = ({ actions, requirement, saved }: EditorContext) => {
  const { t } = useI18n()
  const [base] = useState(requirement)
  const projects = actions.state?.projects ?? []
  const submit = useRequirementSubmission({ actions, base, saved })
  return (
    <form onSubmit={(event) => void submit(event)}>
      {base && (
        <p className="field-note">
          {t('编辑基准版本')} · v{base.version}
        </p>
      )}
      <RequirementFields base={base} projects={projects} />
      <RequirementMetadataFields base={base} />
      <button className="primary" disabled={actions.busy || !projects.length}>
        {t(base ? '保存新版本' : '创建需求')}
      </button>
    </form>
  )
}

const RequirementFields = ({
  base,
  projects,
}: {
  base: RequirementVersion | undefined
  projects: Project[]
}) => {
  const { t } = useI18n()
  return (
    <>
      <label>
        {t('需求所属项目')}
        <select name="project" defaultValue={base?.projectId} disabled={Boolean(base)} required>
          {!projects.length && <option value="">{t('请先添加项目')}</option>}
          {projects.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <TextField name="title" label={t('需求标题')} value={base?.title ?? ''} />
      <TextField name="body" label={t('需求内容')} value={base?.body ?? ''} multiline />
      <TextField
        name="criteria"
        label={t('需求验收条件')}
        value={base?.acceptanceCriteria ?? ''}
        multiline
      />
    </>
  )
}
