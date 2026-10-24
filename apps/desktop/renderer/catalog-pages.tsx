import type { WorkspaceActions } from './use-workspace'
import type { NavigationId } from './navigation'
import { PageHeading } from './page-heading'
import { ProjectSetup } from './project-setup'
import { RoleSetup } from './role-setup'
import { RequirementSetup } from './requirement-setup'
import { TeamSetup } from './team-setup'
import { useI18n } from './preferences'

const titles = {
  projects: ['项目管理', '每一项工作，都有清晰的归属。'],
  roles: ['角色管理', '为团队配置清晰的职责与能力边界。'],
  requirements: ['需求管理', '保留每一次需求变化，让执行有据可依。'],
  teams: ['团队管理', '让不同角色，围绕共同目标协作。'],
} as const
type CatalogId = keyof typeof titles
export const isCatalog = (page: NavigationId): page is CatalogId => page in titles

export const CatalogPage = ({ page, actions }: { page: CatalogId; actions: WorkspaceActions }) => {
  const { t } = useI18n()
  const [title, description] = titles[page]
  return (
    <>
      <PageHeading title={title} description={description} />
      {actions.error && <p role="alert">{t(actions.error)}</p>}
      {!actions.state ? (
        <p role="status">{t('正在读取内核状态…')}</p>
      ) : (
        <div className="catalog-surface">
          {page === 'projects' && (
            <ProjectSetup projects={actions.state.projects} actions={actions} />
          )}
          {page === 'roles' && <RoleSetup state={actions.state} actions={actions} />}
          {page === 'requirements' && <RequirementSetup actions={actions} />}
          {page === 'teams' && <TeamSetup actions={actions} />}
        </div>
      )}
    </>
  )
}
