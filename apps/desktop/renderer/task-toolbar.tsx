import type { Project } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'

export const TaskToolbar = ({
  projects,
  count,
  project,
  search,
  setProject,
  setSearch,
}: {
  projects: Project[]
  count: number
  project: string
  search: string
  setProject: (id: string) => void
  setSearch: (value: string) => void
}) => {
  const { t } = useI18n()
  return (
    <div className="task-toolbar">
      <span>
        {t('全部任务')} · {count}
      </span>
      <label>
        {t('筛选项目')}
        <select value={project} onChange={(event) => setProject(event.target.value)}>
          <option value="">{t('所有项目')}</option>
          {projects.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t('搜索任务')}
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('搜索任务…')}
        />
      </label>
    </div>
  )
}
