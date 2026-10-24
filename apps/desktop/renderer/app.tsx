import { useState } from 'react'
import { useI18n, PreferencesProvider, AppearanceSettings } from './preferences'
import './desktop-api'
import { useWorkspace, type WorkspaceActions } from './use-workspace'
import { navigation, type NavigationId } from './navigation'
import { NavigationIcon } from './navigation-icon'
import { CatalogPage, isCatalog } from './catalog-pages'
import { WorkspaceHome } from './workspace-home'
import { SettingsPage } from './settings-page'
import { SkillPage } from './skill-page'
import { TasksPage } from './tasks-page'

export const App = () => (
  <PreferencesProvider>
    <AppShell />
  </PreferencesProvider>
)

const AppShell = () => {
  const { t } = useI18n()
  const [page, setPage] = useState<NavigationId>('home')
  const [taskId, setTaskId] = useState('')
  const actions = useWorkspace()
  const navigate = (id: NavigationId) => {
    setTaskId('')
    setPage(id)
  }
  const openTask = (id: string) => {
    setTaskId(id)
    setPage('tasks')
  }
  return (
    <div className="workspace">
      <Sidebar page={page} navigate={navigate} actions={actions} />
      <main className="main-shell">
        <div className="topbar">
          <div className="breadcrumbs">
            <span>{t('工作空间')}</span>
            <span>/</span>
            <strong>{t(navigation.find((item) => item.id === page)!.label)}</strong>
          </div>
          <div className="topbar-actions">
            <span className="local-mode">{t('本机执行')}</span>
            <AppearanceSettings />
          </div>
        </div>
        <div className="page-content">
          <PageContent
            page={page}
            taskId={taskId}
            actions={actions}
            navigate={navigate}
            openTask={openTask}
          />
        </div>
      </main>
    </div>
  )
}

interface SidebarProps {
  page: NavigationId
  navigate: (page: NavigationId) => void
  actions: WorkspaceActions
}
const Sidebar = ({ page, navigate, actions }: SidebarProps) => {
  const { t } = useI18n()
  const tasks = actions.state?.tasks.filter((item) => item.purpose !== 'role_trial')
  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="./brand/mark.svg" alt="" width="34" />
        <div>
          <strong>{t('纬舟')}</strong>
          <span>WeftPilot</span>
        </div>
      </div>
      <div className="workspace-identity">
        <span className="owner-avatar">W</span>
        <div>
          <strong>{t('我的工作空间')}</strong>
          <small>{t('单所有者 · 本机')}</small>
        </div>
      </div>
      <nav className="primary-navigation" aria-label={t('主导航')}>
        {navigation.map((item) => (
          <button
            key={item.id}
            aria-label={t(item.label)}
            aria-current={page === item.id ? 'page' : undefined}
            onClick={() => navigate(item.id)}
          >
            <NavigationIcon name={item.id} />
            <span>{t(item.label)}</span>
            {item.id === 'tasks' && tasks?.length ? (
              <small className="navigation-count">{tasks.length}</small>
            ) : null}
          </button>
        ))}
      </nav>
      <SidebarFooter actions={actions} />
    </aside>
  )
}
const SidebarFooter = ({ actions }: { actions: WorkspaceActions }) => {
  const { t } = useI18n()
  const pending = actions.state?.humanRequests.filter((item) => item.status === 'pending').length
  return (
    <div className="sidebar-bottom">
      <div className="runtime-note">
        <span>{t('待处理')}</span>
        <strong>{pending ?? '—'}</strong>
      </div>
      <p>{t('关闭窗口后继续运行；从应用菜单完全退出。')}</p>
      <div className="local-owner">
        <span className="owner-avatar">W</span>
        <div>
          {t('本机所有者')}
          <small>{t('个人工作空间')}</small>
        </div>
      </div>
    </div>
  )
}

const PageContent = ({
  page,
  taskId,
  actions,
  navigate,
  openTask,
}: {
  page: NavigationId
  taskId: string
  actions: WorkspaceActions
  navigate: (page: NavigationId) => void
  openTask: (id: string) => void
}) => {
  if (page === 'home')
    return <WorkspaceHome actions={actions} navigate={navigate} openTask={openTask} />
  if (isCatalog(page)) return <CatalogPage page={page} actions={actions} />
  if (page === 'settings') return <SettingsPage actions={actions} />
  if (page === 'skills') return <SkillPage actions={actions} />
  return <TasksPage actions={actions} taskId={taskId} />
}
