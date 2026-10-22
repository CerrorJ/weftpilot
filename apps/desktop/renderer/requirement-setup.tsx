import { useState } from 'react'
import type { RequirementVersion, Project } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { TextField, formText } from './form-fields'
import { latestVersions } from './object-versions'
export const RequirementSetup = ({ actions }: { actions: WorkspaceActions }) => {
  const { t } = useI18n()
  const [selected, setSelected] = useState('')
  const requirements = latestVersions(actions.state?.requirements ?? [])
  const requirement = requirements.find((item) => item.id === selected)
  return (
    <section className="setup-section">
      <h2>{t('需求版本')}</h2>
      <p>{t('需求必须属于项目。保存新版本不会改写已有任务和执行的需求快照。')}</p>
      <label>
        {t('编辑需求')}
        <select value={selected} onChange={(event) => setSelected(event.target.value)}>
          <option value="">{t('新建需求')}</option>
          {requirements.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title} · v{item.version}
            </option>
          ))}
        </select>
      </label>
      <RequirementForm
        key={`${selected}:${requirement?.version ?? 0}`}
        requirement={requirement}
        projects={actions.state?.projects ?? []}
        actions={actions}
      />
      {requirement && (
        <details>
          <summary>{t('需求历史')}</summary>
          {actions.state?.requirements
            .filter((item) => item.id === requirement.id)
            .map((item) => (
              <article key={item.version}>
                <h3>
                  {item.title} · v{item.version}
                </h3>
                <p className="preserve-text">{item.body}</p>
                <p className="preserve-text">{item.acceptanceCriteria}</p>
              </article>
            ))}
        </details>
      )}
    </section>
  )
}
const RequirementForm = ({
  requirement,
  projects,
  actions,
}: {
  requirement: RequirementVersion | undefined
  projects: Project[]
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  const fields = requirement ?? { title: '', body: '', acceptanceCriteria: '' }
  return (
    <form onSubmit={(event) => submitRequirement(event, requirement, actions)}>
      <label>
        {t('需求所属项目')}
        <select
          name="project"
          defaultValue={requirement?.projectId}
          disabled={Boolean(requirement)}
          required
        >
          {!projects.length && <option value="">{t('请先添加项目')}</option>}
          {projects.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <TextField name="title" label={t('需求标题')} value={fields.title} />
      <TextField name="body" label={t('需求内容')} value={fields.body} multiline />
      <TextField
        name="criteria"
        label={t('需求验收条件')}
        value={fields.acceptanceCriteria}
        multiline
      />
      <button className="primary" disabled={actions.busy || !projects.length}>
        {requirement ? t('保存新版本') : t('创建需求')}
      </button>
    </form>
  )
}
const submitRequirement = (
  event: React.FormEvent<HTMLFormElement>,
  requirement: RequirementVersion | undefined,
  actions: WorkspaceActions,
) => {
  event.preventDefault()
  const form = new FormData(event.currentTarget)
  void actions.execute({
    type: 'requirement.save',
    ...(requirement ? { id: requirement.id } : {}),
    expectedVersion: requirement?.version ?? 0,
    projectId: requirement?.projectId ?? formText(form, 'project'),
    title: formText(form, 'title'),
    body: formText(form, 'body'),
    acceptanceCriteria: formText(form, 'criteria'),
  })
}
