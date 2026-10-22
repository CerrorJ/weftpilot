import { useI18n, PreferencesProvider, AppearanceSettings } from './preferences'
import { useState } from 'react'
import './desktop-api'
import { DiagnosticsPanel } from './diagnostics'
import { WorkflowPage } from './workflow-page'
import { ProductPage } from './product-page'
import { useWorkspace } from './use-workspace'
import type { WorkspaceActions } from './use-workspace'
import { HumanPage } from './human-page'
import { FeishuPage } from './feishu-page'
import { SkillPage } from './skill-page'
const pages = [
  '任务与交付',
  '待处理',
  '项目与角色',
  '模型、需求与团队',
  '飞书连接',
  '技能中心',
  '内核信息',
] as const
type Page = (typeof pages)[number]
export const App = () => (
  <PreferencesProvider>
    <AppShell />
  </PreferencesProvider>
)

const AppShell = () => {
  const { t } = useI18n()
  const [page, setPage] = useState<Page>('任务与交付')
  const actions = useWorkspace()
  return (
    <div className="workspace">
      <aside className="sidebar">
        <div className="brand">
          <img src="./brand/mark.svg" alt="" width="34" />
          <div>
            <strong>{t('纬舟')}</strong>
            <span>WeftPilot</span>
          </div>
        </div>
        <nav aria-label={t('主导航')}>
          {pages.map((item) => (
            <button
              key={item}
              aria-current={page === item ? 'page' : undefined}
              onClick={() => setPage(item)}
            >
              {t(item)}
            </button>
          ))}
        </nav>
        <AppearanceSettings />
        <p className="sidebar-note">
          {t('让 AI 团队，有序抵达。')}
          <br />
          {t('关闭窗口后继续运行；从应用菜单完全退出。')}
        </p>
      </aside>
      <main>
        <PageContent page={page} actions={actions} />
      </main>
    </div>
  )
}

const PageContent = ({ page, actions }: { page: Page; actions: WorkspaceActions }) => {
  if (page === '内核信息') return <DiagnosticsPanel />
  if (page === '飞书连接') return <FeishuPage actions={actions} />
  if (page === '技能中心') return <SkillPage actions={actions} />
  if (page === '待处理') return <HumanPage actions={actions} />
  if (page === '模型、需求与团队') return <ProductPage actions={actions} />
  return <WorkflowPage setup={page === '项目与角色'} actions={actions} />
}
