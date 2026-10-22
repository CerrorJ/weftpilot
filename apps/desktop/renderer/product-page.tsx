import { useI18n } from './preferences'
import type { WorkspaceActions } from './use-workspace'
import { ModelSetup } from './model-setup'
import { RequirementSetup } from './requirement-setup'
import { TeamSetup } from './team-setup'
export const ProductPage = ({ actions }: { actions: WorkspaceActions }) => {
  const { t } = useI18n()
  return (
    <>
      <header>
        <div>
          <h1>{t('模型、需求与团队')}</h1>
          <p>{t('将团队使用的配置保存为可追踪版本。')}</p>
        </div>
      </header>
      {actions.error && <p role="alert">{t(actions.error)}</p>}
      {!actions.state ? (
        <p role="status">{t('正在读取内核状态…')}</p>
      ) : (
        <>
          <ModelSetup actions={actions} />
          <RequirementSetup actions={actions} />
          <TeamSetup actions={actions} />
        </>
      )}
    </>
  )
}
