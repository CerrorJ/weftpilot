import type { ModelProfile } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import type { RoleWizard } from './use-role-wizard'
import { RoleBasics, RolePermission } from './role-configuration-fields'
import { RoleRuntimeStep } from './role-runtime-step'
import { RoleSkills } from './role-skills'
import { RoleWizardTrial } from './role-wizard-trial'
import { useI18n } from './preferences'

export const roleSteps = [
  '基本信息',
  'CLI / 模型',
  'Skills',
  '权限边界',
  '飞书连接',
  '试运行',
] as const

export const RoleWizardFields = ({
  wizard,
  models,
  actions,
  visitSkills,
}: {
  wizard: RoleWizard
  models: ModelProfile[]
  actions: WorkspaceActions
  visitSkills: () => void
}) => {
  const { t } = useI18n()
  const sections = [
    <RoleBasics draft={wizard.initial} existing={!!wizard.base} />,
    <RoleRuntimeStep role={wizard.base} models={models} draft={wizard.initial} />,
    <>
      <button type="button" onClick={visitSkills}>
        {t('去技能市场')}
      </button>
      <RoleSkills skills={actions.state?.skills ?? []} selected={wizard.initial.skills} />
    </>,
    <RolePermission draft={wizard.initial} />,
    <RoleChannel />,
    <RoleWizardTrial wizard={wizard} actions={actions} />,
  ]
  return (
    <>
      {sections.map((content, index) => (
        <section key={index} data-role-step={index} hidden={wizard.step !== index}>
          <h3 tabIndex={-1}>{t(roleSteps[index]!)}</h3>
          {content}
        </section>
      ))}
    </>
  )
}

const RoleChannel = () => {
  const { t } = useI18n()
  return (
    <>
      <label className="check-label">
        <input type="radio" checked readOnly />
        {t('暂不接入飞书')}
      </label>
      <p>{t('桌面角色可以独立工作，飞书为可选的消息与通知入口。')}</p>
      <p className="field-note">
        {t('角色独立飞书应用与路由尚未完成；工作空间连接不会自动视为当前角色已授权。')}
      </p>
    </>
  )
}
