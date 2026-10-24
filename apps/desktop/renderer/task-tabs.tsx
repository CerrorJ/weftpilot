import { useI18n } from './preferences'
import type { TaskView } from './task-views'

const labels = { all: '全部任务', running: '执行中', pending: '待处理', done: '已完成' } as const

export const TaskTabs = ({
  view,
  groups,
  select,
}: {
  view: TaskView
  groups: Record<TaskView, { id: string }[]>
  select: (view: TaskView) => void
}) => {
  const { t } = useI18n()
  return (
    <div className="task-view-tabs" role="group" aria-label={t('任务状态筛选')}>
      {(Object.keys(labels) as TaskView[]).map((key) => (
        <button
          key={key}
          aria-label={t(labels[key])}
          aria-pressed={view === key}
          onClick={() => select(key)}
        >
          {t(labels[key])} <span>{groups[key].length}</span>
        </button>
      ))}
    </div>
  )
}
