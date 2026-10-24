import type { Run, Task, Delivery, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { CreateDialog } from './create-dialog'
import { deliveryReviewView } from './task-run-history'
import { DeliveryArtifacts } from './delivery-artifacts'
import { AcceptanceForm } from './acceptance-form'
import './task-review.css'

interface ReviewContext {
  task: Task
  run: Run
  state: WorkspaceSnapshot
  actions: WorkspaceActions
}

export const DeliveryReview = (context: ReviewContext) => {
  const view = deliveryReviewView(context.state, context.run)
  if (!view.delivery) return null
  return (
    <CreateDialog
      key={view.delivery.id}
      title="交付与验收"
      trigger={view.offerDecision ? '检查交付与验收' : '查看交付与验收'}
      primary={view.offerDecision}
      closeIcon
      error=""
    >
      {(close) => <DeliveryDialog {...context} close={close} />}
    </CreateDialog>
  )
}

const DeliveryDialog = (context: ReviewContext & { close: () => void }) => {
  const { t } = useI18n()
  const view = deliveryReviewView(context.state, context.run)
  if (!view.delivery) return null
  const content = (
    <>
      <DeliveryHeading task={context.task} run={context.run} delivery={view.delivery} view={view} />
      <DeliveryArtifacts delivery={view.delivery} run={context.run} cursor={context.state.cursor} />
    </>
  )
  if (view.offerDecision)
    return (
      <AcceptanceForm
        key={view.delivery.id}
        task={context.task}
        run={context.run}
        delivery={view.delivery}
        actions={context.actions}
        close={context.close}
      >
        {content}
      </AcceptanceForm>
    )
  return (
    <div className="delivery-dialog">
      <div className="review-dialog-content">
        {content}
        <ReadOnlyReview {...context} />
      </div>
      <footer className="review-dialog-footer">
        <button onClick={context.close}>{t('关闭')}</button>
      </footer>
    </div>
  )
}

const DeliveryHeading = ({
  task,
  run,
  delivery,
  view,
}: Pick<ReviewContext, 'task' | 'run'> & {
  delivery: Delivery
  view: ReturnType<typeof deliveryReviewView>
}) => {
  const { t } = useI18n()
  return (
    <header className="delivery-heading">
      <p className="muted code">
        {task.id.slice(0, 8)} / {run.id.slice(0, 8)} · {t('执行记录')} {run.attempt}
      </p>
      <h3>{task.title}</h3>
      <p className="muted">
        {t('交付 v')}
        {delivery.version}
      </p>
      <p>{t(reviewSummaries[view.summaryKind])}</p>
    </header>
  )
}

const reviewSummaries = {
  accepted: '此交付已通过人工验收，记录只读保留。',
  returned: '此交付已退回，原因与原产物保留。',
  partial: '保留本次执行已有的结果，未视为成功交付。',
  pending: 'CLI 已成功结束，交付仍需人工验收。',
  historical: '本次执行成功，历史交付只读保留。',
} as const

const ReadOnlyReview = ({ state, run }: ReviewContext) => {
  const { t, language } = useI18n()
  const view = deliveryReviewView(state, run)
  const review = view.acceptance
  return (
    <section className="review-record">
      <h3>{t('本次 Run 固定的验收标准')}</h3>
      <p className="preserve-text">{run.acceptanceSnapshot}</p>
      {review ? (
        <>
          <p>
            {t(review.decision === 'accepted' ? '已验收' : '验收退回')} ·{' '}
            {new Date(review.createdAt).toLocaleString(language)}
          </p>
          <p className="preserve-text">{review.reason || t('未填写备注')}</p>
          <p className="muted">
            {t('操作者')} · {t('本机所有者')}
          </p>
        </>
      ) : (
        <p>
          {t(
            view.current
              ? '当前交付尚不满足验收条件，请先查看本次执行状态。'
              : '这是历史执行的交付，只读保留；不能用于决定当前执行。',
          )}
        </p>
      )}
    </section>
  )
}
