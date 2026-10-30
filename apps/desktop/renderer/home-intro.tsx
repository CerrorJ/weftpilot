import type { WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import { latestVersions } from './object-versions'
import { taskGroups } from './task-views'
import { useI18n } from './preferences'
import type { HomeProps } from './workspace-home'

export const HomeIntro = ({
  state,
  navigate,
}: {
  state: WorkspaceSnapshot | undefined
  navigate: HomeProps['navigate']
}) => {
  const { t } = useI18n()
  const metrics = [
    ['关联项目', state?.projects.length],
    ['团队角色', state ? latestVersions(state.roles).length : undefined],
    ['正在执行', state ? taskGroups(state).running.length : undefined],
  ] as const
  return (
    <section className="home-intro" aria-label={t('工作空间概览')}>
      <div>
        <h2>{t('一个工作空间，一支 AI 团队。')}</h2>
        <p>{t('从需求、协作到交付，让每一步进展都看得见。')}</p>
        <dl className="home-intro-metrics">
          {metrics.map(([label, value]) => (
            <div key={label}>
              <dt>{t(label)}</dt>
              <dd>{value ?? '—'}</dd>
            </div>
          ))}
        </dl>
      </div>
      <button onClick={() => navigate('tasks')}>{t('查看所有任务')}</button>
    </section>
  )
}
