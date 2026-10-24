import type { WorkspaceActions } from './use-workspace'
import type { RoleWizard } from './use-role-wizard'
import { RoleHealth } from './role-health'
import { useI18n } from './preferences'

export const RoleWizardTrial = ({
  wizard,
  actions,
}: {
  wizard: RoleWizard
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  const draft = wizard.preview
  const model = actions.state?.models.find((item) => `${item.id}@${item.version}` === draft.profile)
  const skills = draft.skills.map(
    (ref) =>
      actions.state?.skills.find((item) => item.id === ref.id && item.digest === ref.digest)
        ?.name ?? t('固定技能版本不可用'),
  )
  return (
    <>
      <dl className="role-review">
        <dt>{t('角色')}</dt>
        <dd>
          {draft.name} <code>{draft.slug}</code>
        </dd>
        <dt>{t('执行配置')}</dt>
        <dd>
          {draft.cli} ·{' '}
          {model
            ? `${model.name} · v${model.version}`
            : draft.model || t('使用 CLI 账户与手动模型')}
        </dd>
        <dt>Skills</dt>
        <dd>{skills.join('、') || t('未绑定')}</dd>
        <dt>{t('权限范围')}</dt>
        <dd>
          {t(draft.permission === 'read-only' ? '只读建议' : '隔离工作目录内写入')} ·{' '}
          {t('最大并发任务数')} {draft.maxConcurrency}
        </dd>
        <dt>{t('飞书连接')}</dt>
        <dd>{t('暂不接入飞书')}</dd>
      </dl>
      {!wizard.saved ? (
        <p>{t('先保存确切配置版本，再进行真实受控试运行。保存配置不会自动启用角色。')}</p>
      ) : wizard.savedRole && actions.state ? (
        <RoleHealth role={wizard.savedRole} state={actions.state} actions={actions} />
      ) : (
        <p role="status">{t('正在读取已保存版本…')}</p>
      )}
    </>
  )
}
