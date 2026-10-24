import { useEffect, useRef } from 'react'
import { useI18n } from './preferences'

/** 提交拒绝后将反馈带入视口，长表单不能只在屏幕外更新错误。 */
export const SubmissionError = ({ message }: { message: string }) => {
  const { t } = useI18n()
  const element = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (message) element.current?.focus()
  }, [message])
  if (!message) return null
  return (
    <p ref={element} role="alert" tabIndex={-1}>
      {t(message)}
    </p>
  )
}
