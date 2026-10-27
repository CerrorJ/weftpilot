import { useState } from 'react'
import type { RequirementVersion, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { PageHeading } from './page-heading'
import { latestVersions } from './object-versions'
import { RequirementEditor } from './requirement-editor'
import { RequirementDetail } from './requirement-detail'
import { RequirementPriority, RequirementStage } from './requirement-metadata'
import './requirement-catalog.css'

export const RequirementSetup = ({
  actions,
  openTask,
}: {
  actions: WorkspaceActions
  openTask: (id: string) => void
}) => {
  const { t } = useI18n()
  const [selected, setSelected] = useState('')
  const state = actions.state
  if (!state) return <p role="status">{t('正在读取内核状态…')}</p>
  const requirements = latestVersions(state.requirements)
  const requirement = requirements.find((item) => item.id === selected)
  return (
    <section className="requirement-page">
      <PageHeading
        title="需求管理"
        description="把目标和验收标准说清楚，再交给团队推进。"
        eyebrow="REQUIREMENTS / INTENT"
      >
        <RequirementEditor actions={actions} saved={setSelected} />
      </PageHeading>
      {actions.error && <p role="alert">{t(actions.error)}</p>}
      <section className="requirement-catalog" aria-label={t('需求列表')}>
        {requirements.map((item) => (
          <RequirementRow
            key={item.id}
            requirement={item}
            state={state}
            open={() => setSelected(item.id)}
          />
        ))}
      </section>
      {!requirements.length && <RequirementEmpty />}
      <p className="field-note">
        {t('需求必须属于项目。保存新版本不会改写已有任务和执行的需求快照。')}
      </p>
      {requirement && (
        <RequirementDetail
          requirement={requirement}
          state={state}
          actions={actions}
          close={() => setSelected('')}
          openTask={openTask}
        />
      )}
    </section>
  )
}

const RequirementEmpty = () => {
  const { t } = useI18n()
  return (
    <section className="empty-state">
      <h2>{t('还没有需求')}</h2>
      <p>{t('先关联项目，再记录目标与验收标准。')}</p>
    </section>
  )
}

const RequirementRow = ({
  requirement,
  state,
  open,
}: {
  requirement: RequirementVersion
  state: WorkspaceSnapshot
  open: () => void
}) => {
  const { t } = useI18n()
  const project = state.projects.find((item) => item.id === requirement.projectId)
  const tasks = state.tasks.filter((task) => task.requirementRef?.id === requirement.id)
  return (
    <article data-requirement-id={requirement.id}>
      <button
        className="requirement-row"
        onClick={open}
        aria-label={`${t('查看需求')} · ${requirement.title}`}
      >
        <span className="requirement-row-top">
          <span>{project?.name ?? requirement.projectId}</span>
          <span className="requirement-metadata">
            <RequirementStage requirement={requirement} />
            <span className="badge">v{requirement.version}</span>
          </span>
        </span>
        <strong>{requirement.title}</strong>
        <span className="requirement-summary">{requirement.body}</span>
        <span className="requirement-row-bottom">
          <RequirementPriority requirement={requirement} />
          <span>
            {tasks.length} {t('条关联任务')}
          </span>
          <span aria-hidden="true">→</span>
        </span>
      </button>
    </article>
  )
}
