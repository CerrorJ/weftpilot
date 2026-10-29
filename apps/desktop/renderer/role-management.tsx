import { useState } from 'react'
import type { RoleVersion, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { CreateDialog } from './create-dialog'
import { RoleHealth } from './role-health'
import { RoleTrialHistory } from './role-trial-history'
import { SubmissionError } from './submission-error'
import { useI18n } from './preferences'
import { RoleChannelStatus } from './role-channel-status'

interface Context {
  role: RoleVersion
  state: WorkspaceSnapshot
  actions: WorkspaceActions
}

export const RoleManagement = (context: Context) => (
  <CreateDialog title="角色运行设置" trigger="试运行与启停" primary={false} closeIcon error="">
    {(close) => <RoleManagementPanel {...context} close={close} />}
  </CreateDialog>
)

const RoleManagementPanel = ({ role, state, actions, close }: Context & { close: () => void }) => {
  const { t } = useI18n()
  const [base] = useState(role)
  const [attempted, setAttempted] = useState(false)
  const operationActions: WorkspaceActions = {
    ...actions,
    execute: (command) => {
      setAttempted(true)
      return actions.execute(command)
    },
  }
  return (
    <div className="role-management-panel">
      <div className="review-dialog-content">
        <SubmissionError message={attempted ? actions.error : ''} />
        <RoleHealth role={base} state={state} actions={operationActions} />
        <p className="muted">
          {t('停用后不再接收新执行，已经创建的执行不会自动停止；停止需单独操作。')}
        </p>
        <RoleTrialHistory role={base} state={state} actions={operationActions} />
        <RoleChannelStatus key={`${base.id}@${base.version}`} role={base} state={state} />
      </div>
      <footer className="review-dialog-footer">
        <button onClick={close}>{t('关闭')}</button>
      </footer>
    </div>
  )
}
