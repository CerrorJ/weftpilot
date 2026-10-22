import { useI18n } from './preferences'
import { useState } from 'react'
import type { Delivery, Run, Task, WorkspaceSnapshot } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
interface ReviewContext {
  task: Task
  run: Run
  state: WorkspaceSnapshot
  actions: WorkspaceActions
}
export const DeliveryReview = ({ task, run, state, actions }: ReviewContext) => {
  const { t } = useI18n()
  const delivery = state.deliveries.find((item) => item.runId === run.id)
  if (!delivery) return null
  const acceptance = state.acceptances.find((item) => item.deliveryId === delivery.id)
  return (
    <section className="delivery">
      <h3>
        {t('交付 v')}
        {delivery.version}
      </h3>
      <p>
        {run.status === 'succeeded'
          ? t('CLI 已成功结束，交付仍需人工验收。')
          : t('保留本次执行已有的结果，未视为成功交付。')}
      </p>
      <h4>{t('执行结果')}</h4>
      <pre>{delivery.answer || t('本次执行没有文本结果。')}</pre>
      <details>
        <summary>{t('代码变更')}</summary>
        <pre className="code">{delivery.diff || t('没有代码差异。')}</pre>
      </details>
      <p className="code">
        {t('交付提交：')}
        {delivery.headCommit}
      </p>
      {acceptance ? (
        <p className="review-record">
          {acceptance.decision === 'accepted' ? t('验收通过') : t('验收退回')} ·{' '}
          {acceptance.reason || t('未填写备注')}
        </p>
      ) : (
        task.status === 'in_review' &&
        run.status === 'succeeded' && (
          <AcceptanceForm key={delivery.id} task={task} delivery={delivery} actions={actions} />
        )
      )}
    </section>
  )
}
const AcceptanceForm = ({
  task,
  delivery,
  actions,
}: {
  task: Task
  delivery: Delivery
  actions: WorkspaceActions
}) => {
  const { t } = useI18n()
  const [reason, setReason] = useState('')
  const decide = (decision: 'accepted' | 'returned') => {
    void actions.execute({
      type: 'delivery.accept',
      deliveryId: delivery.id,
      expectedTaskVersion: task.version,
      decision,
      reason,
    })
  }
  return (
    <div className="acceptance-form">
      <label>
        {t('验收备注 / 退回原因')}
        <textarea
          value={reason}
          maxLength={20000}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
        />
      </label>
      <div className="button-row">
        <button className="primary" disabled={actions.busy} onClick={() => decide('accepted')}>
          {t('验收通过')}
        </button>
        <button disabled={actions.busy || !reason.trim()} onClick={() => decide('returned')}>
          {t('退回并保留原因')}
        </button>
      </div>
    </div>
  )
}
