import type { WorkspaceActions } from './use-workspace'
import type { NavigationId } from './navigation'
import { PageHeading } from './page-heading'
import { ProjectSetup } from './project-setup'
import { RoleSetup, roleCatalogDescription } from './role-setup'
import { RequirementSetup } from './requirement-setup'
import { TeamSetup } from './team-setup'
import { useI18n } from './preferences'

const titles = {
  projects: ['项目管理', '每一项工作，都有清晰的归属。'],
  roles: ['角色管理', roleCatalogDescription],
  requirements: ['需求管理', '保留每一次需求变化，让执行有据可依。'],
  teams: ['团队管理', '让不同角色，围绕共同目标协作。'],
} as const
type CatalogId = keyof typeof titles
export const isCatalog = (page: NavigationId): page is CatalogId => page in titles

export interface RoleNavigation {
  visitSkills: () => void
  resume: boolean
  resumed: () => void
}
export const CatalogPage = ({
  page,
  actions,
  roleNavigation,
  openTask,
  openProjectTasks,
}: {
  page: CatalogId
  actions: WorkspaceActions
  roleNavigation: RoleNavigation
  openTask: (id: string) => void
  openProjectTasks: (id: string) => void
}) => {
  const { t } = useI18n()
  const [title, description] = titles[page]
  if (page === 'roles' && actions.state)
    return <RoleSetup state={actions.state} actions={actions} {...roleNavigation} />
  if (page === 'projects' && actions.state)
    return (
      <ProjectSetup
        state={actions.state}
        actions={actions}
        openTask={openTask}
        openProjectTasks={openProjectTasks}
      />
    )
  return (
    <>
      <PageHeading title={title} description={description} />
      {actions.error && <p role="alert">{t(actions.error)}</p>}
      {!actions.state ? (
        <p role="status">{t('正在读取内核状态…')}</p>
      ) : (
        <div className="catalog-surface">
          {page === 'requirements' && <RequirementSetup actions={actions} />}
          {page === 'teams' && <TeamSetup actions={actions} />}
        </div>
      )}
    </>
  )
}
