import type { WorkspaceActions } from './use-workspace'
import type { RoleWizard } from './use-role-wizard'
import { RoleHealth } from './role-health'
import { useI18n } from './preferences'
import { RoleChannelStatus } from './role-channel-status'
import { RoleConfigurationReview } from './role-review'

export const RoleWizardTrial = ({
  wizard,
  actions,
}: {
  wizard: RoleWizard
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  return (
    <>
      <RoleConfigurationReview draft={wizard.preview} state={actions.state} />
      {!wizard.saved ? (
        <p>{t('先保存确切配置版本，再进行真实受控试运行。保存配置不会自动启用角色。')}</p>
      ) : wizard.savedRole && actions.state ? (
        <RoleHealth role={wizard.savedRole} state={actions.state} actions={actions} />
      ) : (
        <p role="status">{t('正在读取已保存版本…')}</p>
      )}
      {wizard.savedRole && actions.state && (
        <RoleChannelStatus
          key={`${wizard.savedRole.id}@${wizard.savedRole.version}`}
          role={wizard.savedRole}
          state={actions.state}
        />
      )}
    </>
  )
}
