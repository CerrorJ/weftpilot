import { Fragment } from 'react'
import type { Project, ProjectInspection } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'
import { useProjectInspection } from './use-project-inspection'
import { ProjectGitAddress } from './project-git-address'

export const ProjectRepository = ({ project }: { project: Project }) => {
  const { t } = useI18n()
  const inspection = useProjectInspection(project)
  const report = inspection.state.status === 'ready' ? inspection.state.report : undefined
  return (
    <section className="project-repository" aria-labelledby="project-repository-title">
      <div className="project-section-heading">
        <h2 id="project-repository-title">{t('代码仓库')}</h2>
        <button
          disabled={inspection.state.status === 'loading'}
          onClick={() => void inspection.refresh()}
        >
          {t('重新检查仓库')}
        </button>
      </div>
      <InspectionStatus state={inspection.state} />
      <dl className="project-facts">
        <SavedFacts project={project} report={report} />
        <GitFacts report={report} />
        <InspectionTime report={report} />
      </dl>
      <p className="field-note">{t('Git检查是读取时的快照；开始任务时仍会重新预检。')}</p>
    </section>
  )
}

type Report = { report: ProjectInspection | undefined }
const InspectionStatus = ({
  state,
}: {
  state: ReturnType<typeof useProjectInspection>['state']
}) => {
  const { t } = useI18n()
  if (state.status === 'loading') return <p role="status">{t('正在检查仓库…')}</p>
  if (state.status === 'error') return <p role="alert">{t(state.message)}</p>
  return state.report.git.state === 'unavailable' ? (
    <p role="alert">{t(state.report.git.code)}</p>
  ) : null
}

const SavedFacts = ({ project, report }: Report & { project: Project }) => {
  return (
    <>
      <ProjectGitAddress project={project} gitUrl={report ? report.gitUrl : project.gitUrl} />
      <FactRows
        mono
        entries={[
          ['默认分支', project.defaultBranch],
          ['工作目录', project.repositoryPath],
        ]}
      />
    </>
  )
}

const GitFacts = ({ report }: Report) => {
  const { t } = useI18n()
  if (!report || report.git.state !== 'verified')
    return (
      <>
        <FactRows
          mono
          entries={['当前分支', '当前提交', '默认分支提交'].map((label) => [label, '—'])}
        />
        <FactRows entries={[['仓库状态', t('尚未确认仓库状态')]]} />
      </>
    )
  const git = report.git
  return (
    <>
      <FactRows
        mono
        entries={[
          ['当前分支', git.currentBranch ?? t('分离 HEAD')],
          ['当前提交', git.currentCommit],
          ['默认分支提交', git.defaultCommit],
        ]}
      />
      <dt>{t('仓库状态')}</dt>
      <dd className={git.dirty ? 'project-dirty' : ''}>
        {t(git.dirty ? '有未提交改动' : '工作区干净')}
      </dd>
    </>
  )
}

const InspectionTime = ({ report }: Report) => {
  const { language } = useI18n()
  return (
    <FactRows
      entries={[['检查时间', report ? new Date(report.checkedAt).toLocaleString(language) : '—']]}
    />
  )
}

const FactRows = ({ entries, mono = false }: { entries: [string, string][]; mono?: boolean }) => {
  const { t } = useI18n()
  return (
    <>
      {entries.map(([label, value]) => (
        <Fragment key={label}>
          <dt>{t(label)}</dt>
          <dd className={mono ? 'code' : undefined}>{value}</dd>
        </Fragment>
      ))}
    </>
  )
}
