import { useState } from 'react'
import type { HumanRequest, HumanDecision } from '@weftpilot/agent-team-kernel/protocol'
import { useI18n } from './preferences'

type Clarification = Extract<HumanRequest['payload'], { kind: 'clarification' }>['request']
export const ClarificationForm = ({
  request,
  busy,
  resolve,
}: {
  request: Clarification
  busy: boolean
  resolve: (response: HumanDecision) => Promise<unknown>
}) => {
  const { t } = useI18n()
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        const answers = request.questions.map((question) => ({
          questionId: question.id,
          answer:
            String(form.get(`text:${question.id}`) ?? '').trim() ||
            String(form.get(`choice:${question.id}`) ?? ''),
        }))
        void resolve({ decision: 'answered', answers })
      }}
    >
      {request.questions.map((question) => (
        <QuestionAnswer key={question.id} question={question} />
      ))}
      <button className="primary" disabled={busy}>
        {t('提交回答并继续')}
      </button>
    </form>
  )
}

const QuestionAnswer = ({ question }: { question: Clarification['questions'][number] }) => {
  const { t } = useI18n()
  const [text, setText] = useState('')
  return (
    <fieldset>
      <legend>{question.prompt}</legend>
      <label>
        {t('选择回答')}
        <select name={`choice:${question.id}`} defaultValue="" required={!text.trim()}>
          <option value="">{t('请选择，或填写自己的回答')}</option>
          {question.options.map((option) => (
            <option value={option.label} key={option.id}>
              {option.label}
              {option.id === question.recommendedOptionId ? ` · ${t('建议')}` : ''}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t('自己的回答（填写后优先）')}
        <textarea
          name={`text:${question.id}`}
          maxLength={4000}
          rows={2}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </label>
    </fieldset>
  )
}
