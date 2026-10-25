import type { Project, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'
import { NavigationIcon } from './navigation-icon'
import { taskGroups } from './task-views'

export const ProjectCard = ({
  project,
  state,
  open,
}: {
  project: Project
  state: WorkspaceSnapshot
  open: () => void
}) => {
  const { t } = useI18n()
  const groups = taskGroups(state)
  const tasks = groups.all.filter((task) => task.projectId === project.id)
  const done = tasks.filter((task) => task.status === 'done').length
  const running = groups.running.some((task) => task.projectId === project.id)
  return (
    <article className="project-card" data-project-id={project.id}>
      <button
        className="project-card-main"
        aria-label={`${t('查看项目')} · ${project.name}`}
        onClick={open}
      >
        <span className="project-card-top">
          <span className="project-symbol">
            <NavigationIcon name="projects" />
          </span>
          <span className="badge">{t(running ? '推进中' : '已关联')}</span>
        </span>
        <strong className="project-card-name">{project.name}</strong>
        <span className="project-card-path code">{project.repositoryPath}</span>
        <span className="project-card-repo code">
          {project.gitUrl || t('本地仓库（未配置 origin）')}
        </span>
        <span className="project-card-branch">
          {t('默认分支')} · <code>{project.defaultBranch}</code>
        </span>
        <span className="project-card-acceptance">
          <span>{t('任务验收')}</span>
          <span>
            {done} / {tasks.length}
          </span>
        </span>
        {tasks.length > 0 ? (
          <progress aria-label={t('项目任务验收')} max={tasks.length} value={done} />
        ) : (
          <span className="project-card-empty">{t('尚无任务')}</span>
        )}
      </button>
    </article>
  )
}
