import type { Project } from '@weftpilot/agent-team-kernel/protocol'
import type { ReactNode } from 'react'
import { useI18n } from './preferences'

export const TaskToolbar = ({
  projects,
  tabs,
  project,
  search,
  setProject,
  setSearch,
}: {
  projects: Project[]
  tabs: ReactNode
  project: string
  search: string
  setProject: (id: string) => void
  setSearch: (value: string) => void
}) => {
  const { t } = useI18n()
  return (
    <div className="task-toolbar">
      {tabs}
      <label>
        <span className="visually-hidden">{t('筛选项目')}</span>
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
        <span className="visually-hidden">{t('搜索任务')}</span>
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
