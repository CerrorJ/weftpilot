import { useEffect, useRef } from 'react'
import type { Project, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { PageHeading } from './page-heading'
import { ProjectRepository } from './project-repository'
import { TaskCreate } from './task-create'
import { TaskTable } from './task-table'
import { latestVersions } from './object-versions'
import { runLabel } from './task-status'

interface Context {
  project: Project
  state: WorkspaceSnapshot
  actions: WorkspaceActions
  back: () => void
  openTask: (id: string) => void
}

export const ProjectDetail = ({ project, state, actions, back, openTask }: Context) => {
  const { t } = useI18n()
  const heading = useRef<HTMLDivElement>(null)
  useEffect(() => {
    heading.current?.focus()
  }, [])
  const tasks = state.tasks.filter(
    (task) => task.projectId === project.id && task.purpose !== 'role_trial',
  )
  return (
    <section className="project-detail" aria-label={project.name}>
      <button className="project-back" onClick={back}>
        {t('返回项目列表')}
      </button>
      <div ref={heading} tabIndex={-1}>
        <PageHeading
          title={project.name}
          literalTitle
          description="每次执行使用独立分支与工作目录。"
          eyebrow="PROJECT / OVERVIEW"
        >
          <TaskCreate
            projects={[project]}
            roles={latestVersions(state.roles)}
            actions={actions}
            onCreated={openTask}
            trigger="新建项目任务"
          />
        </PageHeading>
      </div>
      <ProjectRepository project={project} />
      <div className="project-section-heading">
        <h2>{t('项目任务')}</h2>
        <span className="badge">{tasks.length}</span>
      </div>
      <TaskTable tasks={tasks} state={state} selectTask={openTask} />
      <ProjectExecutions project={project} state={state} />
    </section>
  )
}

const ProjectExecutions = ({ project, state }: Pick<Context, 'project' | 'state'>) => {
  const { t } = useI18n()
  const runs = state.runs.filter(
    (run) => run.projectId === project.id && run.purpose !== 'role_trial',
  )
  return (
    <section className="project-executions" aria-label={t('项目执行目录')}>
      <div className="project-section-heading">
        <h2>{t('执行分支与目录')}</h2>
        <span className="badge">{runs.length}</span>
      </div>
      {!runs.length ? (
        <p className="empty-state">{t('尚无业务执行记录')}</p>
      ) : (
        <div className="task-table-scroll">
          <table className="task-table">
            <thead>
              <tr>
                {['执行记录', '执行分支', '执行工作目录', '状态'].map((title) => (
                  <th key={title}>{t(title)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...runs].reverse().map((run) => (
                <tr key={run.id}>
                  <td>
                    <code>{run.id.slice(0, 8)}</code>
                    <small>{state.tasks.find((task) => task.id === run.taskId)?.title}</small>
                  </td>
                  <td>
                    <code>{run.executionBranch}</code>
                  </td>
                  <td>
                    <code>{run.workDirectory}</code>
                  </td>
                  <td>{t(runLabel(run))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
