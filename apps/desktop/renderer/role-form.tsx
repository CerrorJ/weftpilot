import type { ModelProfile, RoleVersion } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { CreateDialog } from './create-dialog'
import { useRoleWizard, type RoleWizard } from './use-role-wizard'
import { RoleWizardFields, roleSteps } from './role-wizard-fields'
import { roleDraftStorage } from './role-draft-storage'
import './role-wizard.css'

interface RoleContext {
  role: RoleVersion | undefined
  models: ModelProfile[]
  actions: WorkspaceActions
  visitSkills?: (id?: string) => void
  resume?: boolean
  resumed?: () => void
  hideTrigger?: boolean
  newDraftId?: string
}

export const RoleForm = (props: RoleContext) => (
  <CreateDialog
    title={props.role ? '编辑角色配置' : '创建角色'}
    error={props.actions.error}
    autoOpen={props.resume ?? false}
    onClosed={() => props.resumed?.()}
    hideTrigger={props.hideTrigger ?? false}
  >
    {(close, resetError) => <RoleWizardForm {...props} close={close} resetError={resetError} />}
  </CreateDialog>
)

const RoleWizardForm = ({
  role,
  models,
  actions,
  close,
  visitSkills,
  resetError,
  newDraftId,
}: RoleContext & { close: () => void; resetError: () => void }) => {
  const wizard = useRoleWizard(role, actions, newDraftId)
  return (
    <form
      ref={wizard.form}
      className="role-wizard"
      onChange={() => wizard.persist()}
      onSubmit={(event) => submitRoleStep(event, wizard)}
    >
      <input type="hidden" name="step" value={wizard.step} />
      <input
        type="hidden"
        name="baseVersion"
        value={wizard.base?.version ?? wizard.initial.baseVersion}
      />
      <RoleStepIndicator step={wizard.step} />
      <RoleDraftStatus
        wizard={wizard}
        currentVersion={wizard.currentRole?.version ?? 0}
        resetDraft={() => {
          wizard.reload()
          resetError()
        }}
      />
      <RoleWizardFields
        key={wizard.revision}
        wizard={wizard}
        models={models}
        actions={actions}
        visitSkills={() => {
          wizard.persist()
          close()
          visitSkills?.(wizard.savedRole?.id ?? wizard.base?.id ?? role?.id ?? newDraftId)
        }}
      />
      <RoleWizardFooter wizard={wizard} busy={actions.busy} close={close} />
    </form>
  )
}

/** 原生表单的隐式提交也不能绕过最后一步的明确保存。 */
const submitRoleStep = (event: React.FormEvent<HTMLFormElement>, wizard: RoleWizard) => {
  event.preventDefault()
  if (wizard.step === 5) void wizard.save(event)
}

const RoleStepIndicator = ({ step }: { step: number }) => {
  const { t } = useI18n()
  return (
    <ol className="role-steps" aria-label={t('角色配置步骤')}>
      {roleSteps.map((label, index) => (
        <li key={label} aria-current={step === index ? 'step' : undefined}>
          <span>{index + 1}</span>
          {t(label)}
        </li>
      ))}
    </ol>
  )
}

const RoleDraftStatus = ({
  wizard,
  currentVersion,
  resetDraft,
}: {
  wizard: RoleWizard
  currentVersion: number
  resetDraft: () => void
}) => {
  const { t } = useI18n()
  const version = wizard.saved?.version ?? wizard.base?.version ?? 0
  return (
    <div className="role-draft-status">
      {roleDraftStorage.volatile() && (
        <p role="alert">{t('本窗口草稿暂存于内存，重载或退出后无法恢复。')}</p>
      )}
      <p className="field-note">
        {t('配置版本')} · {version || t('待保存')}
      </p>
      {wizard.baseMissing && (
        <p role="alert">{t('草稿对应的角色版本不可用，不能保存或试运行；表单仍保留。')}</p>
      )}
      {(wizard.baseMissing || currentVersion > version) && (
        <>
          <p>{t('共享配置已经更新。保留当前表单不会覆盖新版本；可明确放弃表单并重新载入。')}</p>
          <button type="button" onClick={resetDraft}>
            {t('放弃表单草稿并读取当前版本')}
          </button>
        </>
      )}
    </div>
  )
}

const RoleWizardFooter = ({
  wizard,
  busy,
  close,
}: {
  wizard: RoleWizard
  busy: boolean
  close: () => void
}) => {
  const { t } = useI18n()
  return (
    <footer className="role-wizard-footer">
      <button
        type="button"
        disabled={busy || wizard.step === 0}
        onClick={() => wizard.changeStep(wizard.step - 1)}
      >
        {t('上一步')}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          wizard.persist()
          close()
        }}
      >
        {t(wizard.saved ? '关闭配置' : '保存表单草稿')}
      </button>
      <span />
      <RoleWizardForward wizard={wizard} busy={busy || wizard.baseMissing} />
    </footer>
  )
}

const RoleWizardForward = ({ wizard, busy }: { wizard: RoleWizard; busy: boolean }) => {
  const { t } = useI18n()
  return wizard.step < 5 ? (
    <button
      key="next"
      type="button"
      className="primary"
      disabled={busy}
      onClick={(event) => {
        // 最后一次“下一步”会换成提交按钮；阻止当前click沿用新DOM的提交默认动作。
        event.preventDefault()
        wizard.changeStep(wizard.step + 1)
      }}
    >
      {t('下一步')}
    </button>
  ) : (
    !wizard.saved && (
      <button key="save" className="primary" disabled={busy}>
        {t(wizard.base ? '保存新版本' : '保存角色配置')}
      </button>
    )
  )
}
