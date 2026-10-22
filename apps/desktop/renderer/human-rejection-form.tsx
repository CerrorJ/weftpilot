import { useState } from 'react'
import type { HumanDecision } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'

export const RejectionForm = ({
  busy,
  resolve,
}: {
  busy: boolean
  resolve: (response: HumanDecision) => Promise<unknown>
}) => {
  const { t } = useI18n()
  const [reason, setReason] = useState('')
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void resolve({ decision: 'rejected', reason: reason.trim() })
      }}
    >
      <label>
        {t('拒绝原因')}
        <textarea
          value={reason}
          maxLength={20000}
          rows={2}
          required
          onChange={(event) => setReason(event.target.value)}
        />
      </label>
      <button disabled={busy || !reason.trim()}>{t('拒绝并结束本次执行')}</button>
    </form>
  )
}
