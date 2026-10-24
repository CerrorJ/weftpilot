import { useRef, useState, type ReactNode } from 'react'
import type { Delivery, Run, Task } from '@weftpilot/agent-team-kernel/protocol'
import type { WorkspaceActions } from './use-workspace'
import { useI18n } from './preferences'
import { SubmissionError } from './submission-error'
import { reviewCriteriaLines } from './task-run-history'

interface AcceptanceContext {
  task: Task
  run: Run
  delivery: Delivery
  actions: WorkspaceActions
  close: () => void
  children: ReactNode
}

/** 核对框仅帮助所有者阅读固定标准；权威验收由内核按交付ID和任务版本原子决定。 */
export const AcceptanceForm = (context: AcceptanceContext) => {
  const { t } = useI18n()
  const [checked, setChecked] = useState<Set<number>>(() => new Set())
  const [reason, setReason] = useState('')
  const criteria = reviewCriteriaLines(context.run.acceptanceSnapshot)
  const complete = criteria.length > 0 && checked.size === criteria.length
  const { decide, attempted } = useAcceptanceDecision(context, { complete, reason })
  return (
    <form
      className="delivery-dialog acceptance-form"
      onSubmit={(event) => {
        event.preventDefault()
        void decide('accepted')
      }}
    >
      <div className="review-dialog-content">
        {context.children}
        <h3>{t('逐项核对验收标准')}</h3>
        <CriteriaChecklist
          criteria={criteria}
          checked={checked}
          setChecked={setChecked}
          disabled={context.actions.busy}
        />
        <label>
          {t('验收备注 / 退回原因')}
          <textarea
            value={reason}
            maxLength={20000}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
          />
        </label>
        <SubmissionError message={attempted ? context.actions.error : ''} />
      </div>
      <AcceptanceFooter
        busy={context.actions.busy}
        complete={complete}
        reason={reason}
        close={context.close}
        decide={decide}
      />
    </form>
  )
}

const AcceptanceFooter = ({
  busy,
  complete,
  reason,
  close,
  decide,
}: {
  busy: boolean
  complete: boolean
  reason: string
  close: () => void
  decide: (decision: 'accepted' | 'returned') => Promise<void>
}) => {
  const { t } = useI18n()
  return (
    <footer className="review-dialog-footer">
      <button type="button" onClick={close} disabled={busy}>
        {t('关闭')}
      </button>
      <button
        type="button"
        disabled={busy || !reason.trim()}
        onClick={() => {
          void decide('returned')
        }}
      >
        {t('退回并保留原因')}
      </button>
      <button className="primary" type="submit" disabled={busy || !complete}>
        {t('验收通过')}
      </button>
    </footer>
  )
}

const useAcceptanceDecision = (
  context: AcceptanceContext,
  input: { complete: boolean; reason: string },
) => {
  const [version] = useState(context.task.version)
  const [attempted, setAttempted] = useState(false)
  const pending = useRef(false)
  const decide = async (decision: 'accepted' | 'returned') => {
    if (
      pending.current ||
      context.actions.busy ||
      (decision === 'accepted' ? !input.complete : !input.reason.trim())
    )
      return
    pending.current = true
    setAttempted(true)
    try {
      const receipt = await context.actions.execute({
        type: 'delivery.accept',
        deliveryId: context.delivery.id,
        expectedTaskVersion: version,
        decision,
        reason: input.reason,
      })
      if (receipt) context.close()
    } finally {
      pending.current = false
    }
  }
  return { decide, attempted }
}

const CriteriaChecklist = ({
  criteria,
  checked,
  setChecked,
  disabled,
}: {
  criteria: string[]
  checked: Set<number>
  setChecked: (value: Set<number>) => void
  disabled: boolean
}) => {
  const { t } = useI18n()
  return (
    <fieldset className="criteria-checklist" disabled={disabled}>
      <legend>{t('本次 Run 固定的验收标准')}</legend>
      {criteria.map((criterion, index) => (
        <label key={index}>
          <input
            type="checkbox"
            checked={checked.has(index)}
            onChange={(event) => {
              const next = new Set(checked)
              if (event.target.checked) next.add(index)
              else next.delete(index)
              setChecked(next)
            }}
          />
          <span className="preserve-text">{criterion}</span>
        </label>
      ))}
    </fieldset>
  )
}
