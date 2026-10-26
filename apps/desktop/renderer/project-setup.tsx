import { useI18n } from './preferences'
import type { WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { PageHeading } from './page-heading'
import { ProjectCreate } from './project-create'
import { ProjectCard } from './project-card'
import { ProjectDetail } from './project-detail'
import { useProjectCatalogSelection } from './use-project-catalog-selection'
import './project-catalog.css'

export const ProjectSetup = ({
  state,
  actions,
  openTask,
  openProjectTasks,
}: {
  state: WorkspaceSnapshot
  actions: WorkspaceActions
  openTask: (id: string) => void
  openProjectTasks: (id: string) => void
}) => {
  const selection = useProjectCatalogSelection(state.projects)
  const project = state.projects.find((item) => item.id === selection.selected)
  return (
    <div className="project-page" ref={selection.root}>
      {project ? (
        <ProjectDetail
          key={project.id}
          project={project}
          state={state}
          actions={actions}
          back={selection.back}
          openTask={openTask}
          openProjectTasks={openProjectTasks}
        />
      ) : (
        <ProjectCatalog state={state} actions={actions} selection={selection} />
      )}
    </div>
  )
}

const ProjectCatalog = ({
  state,
  actions,
  selection,
}: {
  state: WorkspaceSnapshot
  actions: WorkspaceActions
  selection: ReturnType<typeof useProjectCatalogSelection>
}) => {
  const { t } = useI18n()
  return (
    <>
      <PageHeading
        title="项目管理"
        description="连接代码仓库，为团队提供共同的工作上下文。"
        eyebrow="PROJECTS / CONTEXT"
      >
        <ProjectCreate actions={actions} created={selection.created} />
      </PageHeading>
      {actions.error && <p role="alert">{t(actions.error)}</p>}
      <section className="project-catalog" aria-label={t('项目列表')}>
        {state.projects.map((item) => (
          <ProjectCard
            key={item.id}
            project={item}
            state={state}
            open={() => selection.select(item.id)}
          />
        ))}
      </section>
      {!state.projects.length && (
        <section className="empty-state">
          <h2>{t('还没有项目')}</h2>
          <p>{t('关联本机Git仓库，开始第一项真实工作。')}</p>
        </section>
      )}
      <p className="field-note">
        {t('项目绑定主仓库；默认分支、当前分支和各次执行分支分别记录。')}
      </p>
    </>
  )
}
