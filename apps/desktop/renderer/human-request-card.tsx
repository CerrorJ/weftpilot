import type { HumanRequest } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { HumanRequestForm } from './human-request-form'
import './human-requests.css'

export const RunHumanRequests = ({
  runId,
  actions,
}: {
  runId: string
  actions: WorkspaceActions
}) => (
  <>
    {actions.state?.humanRequests
      .filter((request) => request.runId === runId)
      .map((request) => (
        <HumanRequestCard
          key={`${request.id}:${request.version}`}
          request={request}
          actions={actions}
        />
      ))}
  </>
)

export const humanKindLabels = {
  clarification: '澄清问题',
  plan: '方案确认',
  operation: '单次操作审批',
}
const statusLabels = {
  pending: '待处理',
  approved: '已确认',
  answered: '已回答',
  rejected: '已拒绝',
  expired: '已过期',
  cancelled: '已撤销',
}

export const HumanRequestCard = ({
  request,
  actions,
}: {
  request: HumanRequest
  actions: WorkspaceActions
}) => {
  const { t, language } = useI18n()
  const task = actions.state?.tasks.find((item) => item.id === request.taskId)
  const project = actions.state?.projects.find((item) => item.id === request.projectId)
  return (
    <article className="human-request" aria-label={t(humanKindLabels[request.payload.kind])}>
      <div className="section-heading">
        <h3>{t(humanKindLabels[request.payload.kind])}</h3>
        <span className="badge">
          {t(statusLabels[request.status])} · v{request.version}
        </span>
      </div>
      <p className="field-note">
        {project?.name} · {task?.title}
      </p>
      <HumanRequestContent request={request} />
      <p className="field-note">
        {t('有效至：')}
        {new Date(request.expiresAt).toLocaleString(language)}
      </p>
      {request.status === 'pending' ? (
        <HumanRequestForm key={request.id} request={request} actions={actions} />
      ) : (
        <RequestResolution request={request} />
      )}
    </article>
  )
}

const HumanRequestContent = ({ request }: { request: HumanRequest }) => {
  const { t } = useI18n()
  const payload = request.payload
  if (payload.kind === 'clarification')
    return (
      <>
        <h4>{payload.request.title}</h4>
        {payload.request.intro && <p className="preserve-text">{payload.request.intro}</p>}
      </>
    )
  if (payload.kind === 'plan')
    return (
      <>
        <h4>{payload.title}</h4>
        <p className="preserve-text">{payload.summary}</p>
      </>
    )
  return (
    <>
      <h4>{payload.request.operation}</h4>
      <p className="preserve-text">{payload.request.detail}</p>
      <dl>
        <div>
          <dt>{t('影响范围')}</dt>
          <dd>{payload.request.impact}</dd>
        </div>
        <div>
          <dt>{t('回退方式')}</dt>
          <dd>{payload.request.rollback}</dd>
        </div>
      </dl>
      <p className="field-note">{t('批准仅针对本次请求，不扩大角色的工具权限。')}</p>
    </>
  )
}

const RequestResolution = ({ request }: { request: HumanRequest }) => {
  const { t } = useI18n()
  const decision = request.decision
  return (
    <div className="request-resolution">
      {decision?.decision === 'answered' &&
        decision.answers.map((answer) => (
          <p key={answer.questionId} className="preserve-text">
            {answer.answer}
          </p>
        ))}
      {request.resolutionReason && (
        <p className="preserve-text">
          {request.actor?.channel === 'kernel'
            ? t(request.resolutionReason)
            : request.resolutionReason}
        </p>
      )}
      {request.actor && (
        <p className="field-note">
          {t('处理来源：')}
          {t(
            request.actor.channel === 'kernel'
              ? '系统'
              : request.actor.channel === 'feishu'
                ? '飞书'
                : '桌面',
          )}
        </p>
      )}
    </div>
  )
}
