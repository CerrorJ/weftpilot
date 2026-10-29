import { useI18n } from './preferences'

export type TaskLayout = 'list' | 'board'
export const TaskLayoutToggle = ({
  layout,
  change,
}: {
  layout: TaskLayout
  change: (layout: TaskLayout) => void
}) => {
  const { t } = useI18n()
  return (
    <div className="task-layout-toggle" role="group" aria-label={t('任务视图')}>
      {(['list', 'board'] as const).map((value) => (
        <button
          key={value}
          aria-label={t(value === 'list' ? '列表视图' : '看板视图')}
          aria-pressed={layout === value}
          title={t(value === 'list' ? '列表视图' : '看板视图')}
          onClick={() => change(value)}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              d={
                value === 'list'
                  ? 'M4 6h16M4 12h16M4 18h16'
                  : 'M3 4h5v16H3zM10 4h5v12h-5zM17 4h4v9h-4z'
              }
            />
          </svg>
        </button>
      ))}
    </div>
  )
}
