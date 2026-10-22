import type { HumanRequest, HumanDecision } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { ClarificationForm } from './human-clarification-form'
import { RejectionForm } from './human-rejection-form'

interface Context {
  request: HumanRequest
  actions: WorkspaceActions
}

export const HumanRequestForm = ({ request, actions }: Context) => {
  const { t } = useI18n()
  const resolve = (response: HumanDecision) =>
    actions.execute({
      type: 'human.resolve',
      requestId: request.id,
      expectedVersion: request.version,
      expectedDigest: request.digest,
      response,
    })
  return (
    <div className="human-request-form">
      <p>{t('当前执行段已结束。有效决定会续接同一个 Run，失败重试则创建新 Run。')}</p>
      {request.payload.kind === 'clarification' ? (
        <ClarificationForm
          request={request.payload.request}
          busy={actions.busy}
          resolve={resolve}
        />
      ) : (
        <button
          className="primary"
          disabled={actions.busy}
          onClick={() => {
            void resolve({ decision: 'approved' })
          }}
        >
          {request.payload.kind === 'plan' ? t('确认方案并继续') : t('批准本次操作并继续')}
        </button>
      )}
      <RejectionForm busy={actions.busy} resolve={resolve} />
    </div>
  )
}
