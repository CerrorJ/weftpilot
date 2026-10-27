import type { Project, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'
import { NavigationIcon } from './navigation-icon'
import { taskGroups } from './task-views'
import { latestVersions } from './object-versions'

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
        <ProjectCardContext project={project} state={state} />
        <span className="project-card-path code">{project.repositoryPath}</span>
        <span className="project-card-repo code">
          {project.gitUrl || t('本地仓库（未配置 origin）')}
        </span>
        <span className="project-card-branch">
          {t('默认分支')} · <code>{project.defaultBranch}</code>
        </span>
        <ProjectAcceptance done={done} total={tasks.length} />
      </button>
    </article>
  )
}

const ProjectAcceptance = ({ done, total }: { done: number; total: number }) => {
  const { t } = useI18n()
  return (
    <>
      <span className="project-card-acceptance">
        <span>{t('任务验收')}</span>
        <span>
          {done} / {total}
        </span>
      </span>
      {total > 0 ? (
        <progress aria-label={t('项目任务验收')} max={total} value={done} />
      ) : (
        <span className="project-card-empty">{t('尚无任务')}</span>
      )}
    </>
  )
}

const ProjectCardContext = ({ project, state }: { project: Project; state: WorkspaceSnapshot }) => {
  const { t } = useI18n()
  const team = latestVersions(state.teams).find((item) => item.id === project.defaultTeamId)
  return (
    <>
      {(project.goal || project.description) && (
        <span className="project-card-context">{project.goal || project.description}</span>
      )}
      <span className="project-card-team">
        {t('默认团队')} ·{' '}
        {team?.name ?? t(project.defaultTeamId ? '原团队不可用' : '未设置默认团队')}
      </span>
    </>
  )
}
