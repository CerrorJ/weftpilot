import type { WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'
import { ProjectCard } from './project-card'
import type { HomeProps } from './workspace-home'

export const HomeProjects = ({
  state,
  navigate,
  openProject,
}: {
  state: WorkspaceSnapshot | undefined
  navigate: HomeProps['navigate']
  openProject: HomeProps['openProject']
}) => {
  const { t } = useI18n()
  return (
    <section className="home-projects" aria-label={t('我的项目')}>
      <div className="project-section-heading">
        <h2>{t('我的项目')}</h2>
        <button onClick={() => navigate('projects')}>{t('全部项目')}</button>
      </div>
      {!state ? (
        <p role="status">{t('正在读取内核状态…')}</p>
      ) : !state.projects.length ? (
        <p className="home-empty">{t('关联本机Git仓库，开始第一项真实工作。')}</p>
      ) : (
        <div className="project-catalog">
          {state.projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              state={state}
              open={() => openProject(project.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
