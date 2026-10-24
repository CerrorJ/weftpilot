import { useState } from 'react'
import type { WorkspaceActions } from './use-workspace'
import { useI18n, AppearanceSettings } from './preferences'
import { PageHeading } from './page-heading'
import { ModelSetup } from './model-setup'
import { FeishuPage } from './feishu-page'
import { DiagnosticsPanel } from './diagnostics'

const sections = ['通用设置', '模型配置', '飞书连接', '内核信息'] as const
export const SettingsPage = ({ actions }: { actions: WorkspaceActions }) => {
  const { t } = useI18n()
  const [section, setSection] = useState<(typeof sections)[number]>('通用设置')
  return (
    <>
      <PageHeading title="设置" description="管理工作空间、执行工具与本机偏好。" />
      <div className="settings-layout">
        <nav className="settings-nav" aria-label={t('设置分类')}>
          {sections.map((item) => (
            <button
              key={item}
              aria-current={section === item ? 'page' : undefined}
              onClick={() => setSection(item)}
            >
              {t(item)}
            </button>
          ))}
        </nav>
        <div className="settings-content">
          {section === '通用设置' && (
            <section>
              <h2>{t('语言与外观')}</h2>
              <AppearanceSettings expanded />
            </section>
          )}
          {section === '模型配置' && <ModelSetup actions={actions} />}
          {section === '飞书连接' && <FeishuPage actions={actions} />}
          {section === '内核信息' && <DiagnosticsPanel />}
        </div>
      </div>
    </>
  )
}
