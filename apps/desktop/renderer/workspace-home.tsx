import type { NavigationId } from './navigation'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { PageHeading } from './page-heading'
import { TaskCreate } from './task-create'
import { latestVersions } from './object-versions'
import { HomeIntro } from './home-intro'
import { HomeTaskPanels } from './home-task-panels'
import { HomeProjects } from './home-projects'
import './workbench.css'

export interface HomeProps {
  actions: WorkspaceActions
  navigate: (page: NavigationId) => void
  openTask: (id: string) => void
  openProject: (id: string) => void
}

export const WorkspaceHome = ({ actions, navigate, openTask, openProject }: HomeProps) => {
  const { t } = useI18n()
  const state = actions.state
  return (
    <div className="workbench">
      <PageHeading
        title="让团队，开始推进。"
        description="查看工作进展，把注意力留给需要你决定的事。"
      >
        {state && (
          <TaskCreate
            projects={state.projects}
            roles={latestVersions(state.roles)}
            actions={actions}
            trigger="发起任务"
            onCreated={openTask}
          />
        )}
      </PageHeading>
      {actions.error && <p role="alert">{t(actions.error)}</p>}
      <HomeIntro state={state} navigate={navigate} />
      <HomeTaskPanels state={state} openTask={openTask} />
      <HomeProjects state={state} navigate={navigate} openProject={openProject} />
    </div>
  )
}
