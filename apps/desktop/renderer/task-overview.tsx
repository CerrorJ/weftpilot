import type { WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'

export const TaskOverview = ({ state }: { state: WorkspaceSnapshot | undefined }) => {
  const { t } = useI18n()
  const tasks = state?.tasks.filter((task) => task.purpose !== 'role_trial') ?? []
  const pending = new Set(
    state?.humanRequests.filter((item) => item.status === 'pending').map((item) => item.taskId),
  )
  const metrics = [
    ['所有任务', tasks.length, '绑定项目，独立记录每次执行'],
    ['执行中', tasks.filter((task) => task.status === 'in_progress').length, '当前由团队成员推进'],
    [
      '待我处理',
      tasks.filter((task) => task.status === 'in_review' || pending.has(task.id)).length,
      '确认方案与验收交付',
    ],
    ['已完成', tasks.filter((task) => task.status === 'done').length, '已验收通过的任务'],
  ] as const
  return (
    <section className="workspace-metrics task-metrics" aria-label={t('任务概览')}>
      {metrics.map(([label, value, note]) => (
        <div key={label}>
          <span>{t(label)}</span>
          <strong>{state ? value : '—'}</strong>
          <p>{t(note)}</p>
        </div>
      ))}
    </section>
  )
}
