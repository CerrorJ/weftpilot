import { useI18n } from './preferences'
import type { WorkspaceActions } from './use-workspace'
import type { WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { NavigationId } from './navigation'
import { PageHeading } from './page-heading'
import { latestVersions } from './object-versions'
import { taskLabels } from './task-status'

interface HomeProps {
  actions: WorkspaceActions
  navigate: (page: NavigationId) => void
  openTask: (id: string) => void
}
export const WorkspaceHome = ({ actions, navigate, openTask }: HomeProps) => {
  const { t } = useI18n()
  return (
    <>
      <PageHeading title="工作台" description="让 AI 团队，有序抵达。">
        <button className="primary" onClick={() => navigate('tasks')}>
          {t('进入任务管理')}
        </button>
      </PageHeading>
      {actions.error && <p role="alert">{t(actions.error)}</p>}
      <WorkspaceMetrics state={actions.state} />
      <div className="home-columns">
        <RecentTasks state={actions.state} navigate={navigate} openTask={openTask} />
        <TeamSummary state={actions.state} navigate={navigate} />
      </div>
    </>
  )
}

const WorkspaceMetrics = ({ state }: { state: WorkspaceSnapshot | undefined }) => {
  const { t } = useI18n()
  const tasks = state?.tasks.filter((task) => task.purpose !== 'role_trial') ?? []
  const metrics = [
    ['项目', state?.projects.length],
    ['执行中', state ? tasks.filter((task) => task.status === 'in_progress').length : undefined],
    ['待验收', state ? tasks.filter((task) => task.status === 'in_review').length : undefined],
    ['已验收', state ? tasks.filter((task) => task.status === 'done').length : undefined],
  ] as const
  return (
    <section className="workspace-metrics" aria-label={t('工作空间概览')}>
      {metrics.map(([label, value]) => (
        <div key={label}>
          <span>{t(label)}</span>
          <strong>{value ?? '—'}</strong>
        </div>
      ))}
    </section>
  )
}

const RecentTasks = ({
  state,
  navigate,
  openTask,
}: {
  state: WorkspaceSnapshot | undefined
  navigate: HomeProps['navigate']
  openTask: HomeProps['openTask']
}) => {
  const { t } = useI18n()
  const tasks = state?.tasks.filter((task) => task.purpose !== 'role_trial') ?? []
  return (
    <section className="home-recent">
      <h2>{t('最近任务')}</h2>
      {!state ? (
        <p role="status">{t('正在读取内核状态…')}</p>
      ) : !tasks.length ? (
        <div className="empty-state">
          <h3>{t('还没有任务')}</h3>
          <p>{t('先添加项目和角色，再开始第一项真实任务。')}</p>
          <button onClick={() => navigate('projects')}>{t('添加项目')}</button>
        </div>
      ) : (
        <ul className="recent-task-list">
          {[...tasks]
            .reverse()
            .slice(0, 8)
            .map((task) => (
              <li key={task.id}>
                <button onClick={() => openTask(task.id)}>
                  <strong>{task.title}</strong>
                  <small>
                    {state.projects.find((project) => project.id === task.projectId)?.name}
                  </small>
                  <span className="badge">{t(taskLabels[task.status])}</span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </section>
  )
}

const TeamSummary = ({
  state,
  navigate,
}: {
  state: WorkspaceSnapshot | undefined
  navigate: HomeProps['navigate']
}) => {
  const { t } = useI18n()
  return (
    <section className="home-team">
      <h2>{t('我的 AI 团队')}</h2>
      <p>
        {t('角色')} · {state ? latestVersions(state.roles).length : '—'}
      </p>
      <p>
        {t('团队')} · {state ? latestVersions(state.teams).length : '—'}
      </p>
      <button onClick={() => navigate('teams')}>{t('管理团队')}</button>
      <p className="field-note">{t('项目、角色与任务状态均来自本机内核。')}</p>
    </section>
  )
}
